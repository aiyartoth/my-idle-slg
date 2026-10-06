import { describe, expect, it } from 'vitest'
import { BASIC_UNIT_CARDS, INFANTRY_CARD, TEMPLE_KNIGHT_CARD } from '../data/cards'
import { cellsOf, keyOf, manhattan, openSummonTiles } from './board'
import { actingOrder, advanceBattle, explainStrike, stepBattle, strikeDamage, type BoardUnit } from './battle'
import { classicRealmTiles } from './realmMap'
import { createYellowTurbanBattle, PLAYER_BASE_HP, YELLOW_ARCHER_CARD, YELLOW_INFANTRY_CARD, YELLOW_TURBAN_BASE_HP, ZHANG_JIAO_CARD } from './yellowTurban'

/** 洗牌时总换到自己，牌序保持原样。用来测固定起手 */
const keepOrder = () => 1 - Number.EPSILON

/**
 * 开一局黄巾，地形换成经典棋盘。正式开战的地图是随机的，走位测试仍用固定路口。
 *
 * @param args 传给黄巾开局的生命、卡组和随机数
 * @returns 第 0 回合的局面
 */
function yellowTurbanBattle(...args: Parameters<typeof createYellowTurbanBattle>) {
  return { ...createYellowTurbanBattle(...args), tiles: classicRealmTiles() }
}

describe('黄巾之乱', () => {
  it('黄巾兵和对应基础兵的战斗属性相同', () => {
    const archer = BASIC_UNIT_CARDS.find((card) => card.id === 'archer')
    const infantry = BASIC_UNIT_CARDS.find((card) => card.id === 'infantry')
    expect(archer).toBeDefined()
    expect(infantry).toBeDefined()
    expect(YELLOW_INFANTRY_CARD).toMatchObject({
      atk: infantry?.atk,
      hp: infantry?.hp,
      cd: infantry?.cd,
      move: infantry?.move,
      speed: infantry?.speed,
      range: infantry?.range,
    })
    expect(YELLOW_ARCHER_CARD).toMatchObject({
      atk: archer?.atk,
      hp: archer?.hp,
      cd: archer?.cd,
      move: archer?.move,
      speed: archer?.speed,
      range: archer?.range,
    })
  })

  it('重甲挡物理，破甲和法术穿透能打穿对应护甲', () => {
    const infantry = BASIC_UNIT_CARDS.find((card) => card.id === 'infantry')
    const heavy = BASIC_UNIT_CARDS.find((card) => card.id === 'heavy-infantry')
    const musketeer = BASIC_UNIT_CARDS.find((card) => card.id === 'musketeer')
    const archer = BASIC_UNIT_CARDS.find((card) => card.id === 'archer')
    const mage = BASIC_UNIT_CARDS.find((card) => card.id === 'mage')
    const ward = BASIC_UNIT_CARDS.find((card) => card.id === 'ward-guard')
    if (!infantry || !heavy || !musketeer || !archer || !mage || !ward) throw new Error('缺卡')
    expect(strikeDamage(infantry, heavy)).toBe(0)
    expect(strikeDamage(archer, heavy)).toBe(1)
    expect(strikeDamage(musketeer, heavy)).toBe(4)
    expect(strikeDamage(mage, ward)).toBe(4)
    expect(strikeDamage(mage, heavy)).toBe(4)
    expect(strikeDamage(infantry, ward)).toBe(2)
    expect(explainStrike(infantry, heavy)).toMatchObject({ baseAtk: 2, extraAtk: 0, armor: 2, pierce: 0, reduced: 2, damage: 0 })
    expect(explainStrike(musketeer, heavy)).toMatchObject({ armor: 2, pierce: 2, reduced: 0, damage: 4 })
  })

  it('开战前洗牌，牌还是原来那一套，顺序会变', () => {
    const steady = yellowTurbanBattle(PLAYER_BASE_HP, BASIC_UNIT_CARDS, keepOrder)
    expect(steady.playerHand.map((card) => card.card.name)).toEqual(['步兵', '重甲步兵', '弓箭手'])
    expect(steady.enemyDeck.map((card) => card.card.name)).toEqual(['天公将军张角'])
    expect(steady.history[0]).toMatchObject({ turn: 0, kind: 'note', text: '开战前，双方洗牌' })
    expect(steady.history[1]).toMatchObject({ turn: 0, kind: 'note', text: '我方起手 步兵、重甲步兵、弓箭手' })
    expect(steady.log).toContain('黄巾起手 黄巾步兵、黄巾步兵、黄巾弓箭手')

    const shuffled = yellowTurbanBattle(PLAYER_BASE_HP, BASIC_UNIT_CARDS, () => 0)
    expect(shuffled.playerHand.map((card) => card.card.name)).toEqual(['重甲步兵', '弓箭手', '火枪手'])
    expect([...shuffled.playerHand, ...shuffled.playerDeck].map((card) => card.card.id).sort()).toEqual(
      BASIC_UNIT_CARDS.map((card) => card.id).sort(),
    )
    expect([...shuffled.enemyHand, ...shuffled.enemyDeck].map((card) => card.card.name).sort()).toEqual(
      ['天公将军张角', '黄巾步兵', '黄巾步兵', '黄巾弓箭手'].sort(),
    )
    expect(BASIC_UNIT_CARDS.map((card) => card.id)).toEqual(['infantry', 'heavy-infantry', 'archer', 'musketeer', 'mage', 'ward-guard'])
  })

  it('第一回合召唤冷却为 0 的兵，并朝敌营前进', () => {
    const battle = stepBattle(yellowTurbanBattle(PLAYER_BASE_HP, BASIC_UNIT_CARDS, keepOrder))
    const player = battle.units.filter((unit) => unit.side === 'player')
    const enemy = battle.units.filter((unit) => unit.side === 'enemy')
    expect(battle.history.some((event) => event.kind === 'summon' && event.actor.card.name === '步兵')).toBe(true)
    expect(player.some((unit) => unit.row < 7)).toBe(true)
    expect(battle.log).toContain('我方召唤 步兵')
    expect(battle.log).toContain('我方召唤 弓箭手')
    expect(player.some((unit) => unit.row < 7)).toBe(true)
    expect(enemy).toHaveLength(3)
    expect(battle.playerHand.map((card) => `${card.card.name}:${card.cd}`)).toEqual(['重甲步兵:1', '火枪手:2'])
    expect(battle.enemyHand.map((card) => `${card.card.name}:${card.cd}`)).toEqual(['天公将军张角:5'])
    expect(battle.playerBaseHp).toBe(40)
    const blocked = new Set(
      battle.tiles.flatMap((row, rowIndex) =>
        row.flatMap((tile, col) => (tile === 'river' || tile === 'stone' ? [keyOf({ row: rowIndex, col })] : [])),
      ),
    )
    expect(battle.units.some((unit) => blocked.has(keyOf(unit)))).toBe(false)
    expect(battle.routes.some((route) => route.path.length > 1)).toBe(true)
    for (const route of battle.routes) {
      for (let index = 1; index < route.path.length; index += 1) {
        const from = route.path[index - 1]
        const to = route.path[index]
        expect(Math.abs(from.row - to.row) + Math.abs(from.col - to.col)).toBe(1)
      }
    }
  })

  it('速度高的先动，速度相同按上场先后，同时上场我方优先', () => {
    const unit = (speed: number, entered: number, side: 'player' | 'enemy'): BoardUnit => ({
      uid: `${side}-${entered}-${speed}`,
      side,
      card: { ...INFANTRY_CARD, speed },
      row: 0,
      col: 0,
      hp: 1,
      entered,
    })
    const fastEnemy = unit(3, 9, 'enemy')
    const slowPlayer = unit(1, 1, 'player')
    const earlyEnemy = unit(2, 1, 'enemy')
    const latePlayer = unit(2, 4, 'player')
    const samePlayer = unit(2, 0, 'player')
    const sameEnemy = unit(2, 0, 'enemy')
    expect([slowPlayer, fastEnemy].sort(actingOrder).map((item) => item.uid)).toEqual([fastEnemy.uid, slowPlayer.uid])
    expect([latePlayer, earlyEnemy].sort(actingOrder).map((item) => item.uid)).toEqual([earlyEnemy.uid, latePlayer.uid])
    expect([sameEnemy, samePlayer].sort(actingOrder).map((item) => item.side)).toEqual(['player', 'enemy'])
  })

  it('先行动的兵击破目标后，目标不再反击', () => {
    const musketeer = BASIC_UNIT_CARDS.find((card) => card.id === 'musketeer')
    const infantry = BASIC_UNIT_CARDS.find((card) => card.id === 'infantry')
    if (!musketeer || !infantry) throw new Error('缺卡')
    const start = yellowTurbanBattle()
    const player: BoardUnit = {
      uid: 'p',
      side: 'player',
      card: { ...musketeer, move: 0 },
      row: 5,
      col: 4,
      hp: musketeer.hp,
      entered: 1,
    }
    const enemy: BoardUnit = {
      uid: 'e',
      side: 'enemy',
      card: { ...infantry, move: 0, atk: 9 },
      row: 5,
      col: 5,
      hp: 4,
      entered: 2,
    }
    const afterPlayer = advanceBattle({ ...start, turn: 1, units: [player, enemy], queue: [player.uid, enemy.uid] })
    expect(afterPlayer.units.map((unit) => unit.uid)).toEqual(['p'])
    expect(afterPlayer.queue).toEqual(['e'])
    expect(afterPlayer.strike).toMatchObject({ attackerUid: 'p', targetUid: 'e', kind: 'damage', amount: 4 })
    const afterEnemy = advanceBattle(afterPlayer)
    expect(afterEnemy.queue).toEqual([])
    expect(afterEnemy.log).toEqual([])
    expect(afterEnemy.playerBaseHp).toBe(start.playerBaseHp)
    expect(afterEnemy.units.find((unit) => unit.uid === 'p')?.hp).toBe(musketeer.hp)
  })

  it('大本营旁边没有空地时不能再召唤', () => {
    const battle = yellowTurbanBattle()
    const occupied = new Set(openSummonTiles('player', battle.tiles, new Set()).map(keyOf))
    expect(openSummonTiles('player', battle.tiles, occupied)).toEqual([])
  })

  it('圣殿骑士行动前给生命最低的友方回复 1 点，满血就不再加', () => {
    const start = yellowTurbanBattle()
    const quiet = { playerHand: [], playerDeck: [], enemyHand: [], enemyDeck: [] }
    const knight: BoardUnit = { uid: 'k', side: 'player', card: TEMPLE_KNIGHT_CARD, row: 7, col: 4, hp: 3, entered: 1 }
    const hurt: BoardUnit = { uid: 'a', side: 'player', card: INFANTRY_CARD, row: 7, col: 3, hp: 1, entered: 2 }
    const full: BoardUnit = { uid: 'b', side: 'player', card: INFANTRY_CARD, row: 7, col: 5, hp: INFANTRY_CARD.hp, entered: 3 }
    const opened = advanceBattle({
      ...start,
      units: [knight, hurt, full],
      queue: [],
      ...quiet,
      enemyDeck: [{ uid: 'pad', card: INFANTRY_CARD, cd: 9 }],
    })
    const healAt = opened.queue.indexOf('heal:k')
    expect(opened.queue[healAt + 1]).toBe('k')
    const healed = advanceBattle({ ...start, turn: 1, units: [knight, hurt, full], queue: ['heal:k', 'k'], ...quiet })
    expect(healed.units.find((unit) => unit.uid === 'a')?.hp).toBe(2)
    expect(healed.units.find((unit) => unit.uid === 'k')?.hp).toBe(3)
    expect(healed.units.find((unit) => unit.uid === 'b')?.hp).toBe(INFANTRY_CARD.hp)
    expect(healed.strike).toMatchObject({ kind: 'heal', amount: 1, attackerUid: 'k', targetUid: 'a' })
    expect(healed.history.at(-1)).toMatchObject({ kind: 'heal', amount: 1 })
    expect(healed.units.find((unit) => unit.uid === 'k')).toMatchObject({ row: 7, col: 4 })

    const cappedKnight = { ...knight, hp: TEMPLE_KNIGHT_CARD.hp - 1 }
    const capped = advanceBattle({ ...start, turn: 1, units: [cappedKnight, { ...full, uid: 'b' }], queue: ['heal:k'], ...quiet })
    expect(capped.units.find((unit) => unit.uid === 'k')?.hp).toBe(TEMPLE_KNIGHT_CARD.hp)
    const idle = advanceBattle({
      ...start,
      turn: 1,
      units: [
        { ...knight, hp: TEMPLE_KNIGHT_CARD.hp },
        { ...full, uid: 'b' },
      ],
      queue: ['heal:k'],
      ...quiet,
    })
    expect(idle.strike).toBeNull()
    expect(idle.units.find((unit) => unit.uid === 'k')?.hp).toBe(TEMPLE_KNIGHT_CARD.hp)
  })

  it('警戒优先追击更靠近敌方大本营的敌人，范围内也先打后方', () => {
    const start = yellowTurbanBattle()
    const quiet = { playerHand: [], playerDeck: [], enemyHand: [], enemyDeck: [] }
    const rear: BoardUnit = { uid: 'rear', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 2, hp: 6, entered: 2 }
    const front: BoardUnit = { uid: 'front', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 4, hp: 1, entered: 3 }
    const knight: BoardUnit = { uid: 'k', side: 'player', card: TEMPLE_KNIGHT_CARD, row: 6, col: 4, hp: TEMPLE_KNIGHT_CARD.hp, entered: 1 }
    const plain: BoardUnit = { ...knight, card: { ...TEMPLE_KNIGHT_CARD, skills: [] } }
    const chased = advanceBattle({ ...start, turn: 1, units: [knight, rear, front], queue: ['k'], ...quiet })
    const straight = advanceBattle({ ...start, turn: 1, units: [plain, rear, front], queue: ['k'], ...quiet })
    const chasedAt = chased.units.find((unit) => unit.uid === 'k')
    const straightAt = straight.units.find((unit) => unit.uid === 'k')
    expect(straightAt).toMatchObject({ row: 6, col: 4 })
    expect(chasedAt?.col).toBeLessThan(4)
    expect(Math.abs((chasedAt?.row ?? 0) - rear.row) + Math.abs((chasedAt?.col ?? 0) - rear.col)).toBeLessThan(
      Math.abs((straightAt?.row ?? 0) - rear.row) + Math.abs((straightAt?.col ?? 0) - rear.col),
    )

    const inRange: BoardUnit = { ...knight, card: { ...TEMPLE_KNIGHT_CARD, move: 0 }, row: 2, col: 7 }
    const rearFoe: BoardUnit = { ...rear, row: 1, col: 7, hp: 6 }
    const frontFoe: BoardUnit = { ...front, row: 2, col: 6, hp: 1 }
    const struck = advanceBattle({ ...start, turn: 1, units: [inRange, rearFoe, frontFoe], queue: ['k'], ...quiet })
    expect(struck.strike).toMatchObject({ kind: 'damage', targetUid: 'rear' })
    const nearest = advanceBattle({
      ...start,
      turn: 1,
      units: [{ ...inRange, card: { ...TEMPLE_KNIGHT_CARD, move: 0, skills: [] } }, rearFoe, frontFoe],
      queue: ['k'],
      ...quiet,
    })
    expect(nearest.strike).toMatchObject({ kind: 'damage', targetUid: 'front' })
  })

  it('普通单位靠近敌人且不能后退，警戒可以后退追击', () => {
    const start = yellowTurbanBattle()
    const quiet = { playerHand: [], playerDeck: [], enemyHand: [], enemyDeck: [] }
    const beside: BoardUnit = { uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 6, col: 3, hp: 4, entered: 2 }
    const plain: BoardUnit = { uid: 'p', side: 'player', card: INFANTRY_CARD, row: 6, col: 1, hp: INFANTRY_CARD.hp, entered: 1 }
    const closed = advanceBattle({ ...start, turn: 1, units: [plain, beside], queue: ['p'], ...quiet })
    expect(closed.units.find((unit) => unit.uid === 'p')).toMatchObject({ row: 6, col: 2 })

    const behind: BoardUnit = { uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 6, col: 3, hp: 4, entered: 2 }
    const forward: BoardUnit = { uid: 'p', side: 'player', card: INFANTRY_CARD, row: 3, col: 5, hp: INFANTRY_CARD.hp, entered: 1 }
    const held = advanceBattle({ ...start, turn: 1, units: [forward, behind], queue: ['p'], ...quiet })
    expect(held.units.find((unit) => unit.uid === 'p')?.row).toBeLessThan(3)

    const knight: BoardUnit = { uid: 'k', side: 'player', card: TEMPLE_KNIGHT_CARD, row: 3, col: 5, hp: TEMPLE_KNIGHT_CARD.hp, entered: 1 }
    const turned = advanceBattle({ ...start, turn: 1, units: [knight, behind], queue: ['k'], ...quiet })
    expect(turned.units.find((unit) => unit.uid === 'k')?.row).toBeGreaterThan(3)
  })

  it('石头和河流挡住直线时会绕路，已经能打到的远程不走出攻击范围', () => {
    const start = yellowTurbanBattle()
    const quiet = { playerHand: [], playerDeck: [], enemyHand: [], enemyDeck: [{ uid: 'pad', card: INFANTRY_CARD, cd: 99 }] }
    const walker: BoardUnit = { uid: 'p', side: 'player', card: { ...INFANTRY_CARD, move: 1 }, row: 5, col: 8, hp: INFANTRY_CARD.hp, entered: 1 }
    const bases = cellsOf(start.tiles, 'enemyBase')
    const distance = (unit: BoardUnit | undefined) => (unit ? Math.min(...bases.map((cell) => manhattan(unit, cell))) : 99)
    let state = advanceBattle({ ...start, turn: 1, units: [walker], queue: ['p'], ...quiet })
    expect(state.units.find((unit) => unit.uid === 'p')).not.toMatchObject({ row: 5, col: 8 })
    for (let step = 0; step < 40 && state.result === 'ongoing'; step += 1) {
      const at = state.units.find((unit) => unit.uid === 'p')
      expect(at).toBeDefined()
      if (!at) break
      expect(state.tiles[at.row][at.col] === 'stone' || state.tiles[at.row][at.col] === 'river').toBe(false)
      state = advanceBattle(state)
    }
    expect(distance(state.units.find((unit) => unit.uid === 'p'))).toBeLessThan(distance(walker))

    const archer = BASIC_UNIT_CARDS.find((card) => card.id === 'archer')
    if (!archer) throw new Error('缺弓箭手')
    const shooter: BoardUnit = { uid: 'a', side: 'player', card: archer, row: 5, col: 6, hp: archer.hp, entered: 1 }
    const foe: BoardUnit = { uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 9, hp: 4, entered: 2 }
    const held = advanceBattle({ ...start, turn: 1, units: [shooter, foe], queue: ['a'], ...quiet })
    expect(held.units.find((unit) => unit.uid === 'a')).toMatchObject({ row: 5, col: 6 })
    expect(held.strike).toMatchObject({ attackerUid: 'a', targetUid: 'e', kind: 'damage' })
  })

  it('撒豆成兵在回合开始时于周围召黄巾兵，没有空位就跳过', () => {
    const start = yellowTurbanBattle()
    const quiet = { playerHand: [], playerDeck: [], enemyHand: [], enemyDeck: [] }
    const zhang: BoardUnit = { uid: 'z', side: 'enemy', card: ZHANG_JIAO_CARD, row: 2, col: 4, hp: ZHANG_JIAO_CARD.hp, entered: 1 }
    const pad = { playerDeck: [{ uid: 'pad', card: INFANTRY_CARD, cd: 9 }] }
    const opened = advanceBattle({ ...start, units: [zhang], queue: [], random: () => 0, ...quiet, ...pad })
    const minion = opened.units.find((unit) => unit.uid !== 'z')
    expect(minion?.card.id).toBe('yellow-infantry')
    expect(minion?.side).toBe('enemy')
    expect(Math.abs((minion?.row ?? 0) - zhang.row) + Math.abs((minion?.col ?? 0) - zhang.col)).toBe(1)
    expect(opened.history.some((event) => event.kind === 'summon' && event.actor.card.id === 'yellow-infantry')).toBe(true)
    const boltAt = opened.queue.indexOf('bolt:z')
    expect(opened.queue[boltAt + 1]).toBe('z')

    const rolls = [0.5, 0]
    let index = 0
    const archer = advanceBattle({ ...start, units: [zhang], queue: [], random: () => rolls[index++] ?? 0, ...quiet, ...pad })
    expect(archer.units.find((unit) => unit.uid !== 'z')?.card.id).toBe('yellow-archer')

    const blocked: BoardUnit[] = [
      zhang,
      { uid: 'a', side: 'player', card: INFANTRY_CARD, row: 1, col: 4, hp: 1, entered: 2 },
      { uid: 'b', side: 'player', card: INFANTRY_CARD, row: 3, col: 4, hp: 1, entered: 3 },
      { uid: 'c', side: 'player', card: INFANTRY_CARD, row: 2, col: 3, hp: 1, entered: 4 },
      { uid: 'd', side: 'player', card: INFANTRY_CARD, row: 2, col: 5, hp: 1, entered: 5 },
    ]
    const stuck = advanceBattle({ ...start, units: blocked, queue: [], random: () => 0, ...quiet })
    expect(stuck.units).toHaveLength(blocked.length)
    expect(stuck.history.some((event) => event.kind === 'nospace' && event.actor.uid === 'z')).toBe(true)
  })

  it('雷电招来对随机敌人造成 3 点法术伤害，魔甲会减伤', () => {
    const start = yellowTurbanBattle()
    const quiet = { playerHand: [], playerDeck: [], enemyHand: [], enemyDeck: [] }
    const ward = BASIC_UNIT_CARDS.find((card) => card.id === 'ward-guard')
    if (!ward) throw new Error('缺卡')
    const zhang: BoardUnit = { uid: 'z', side: 'enemy', card: ZHANG_JIAO_CARD, row: 2, col: 4, hp: ZHANG_JIAO_CARD.hp, entered: 1 }
    const foe: BoardUnit = { uid: 'p', side: 'player', card: INFANTRY_CARD, row: 7, col: 4, hp: 4, entered: 2 }
    const struck = advanceBattle({ ...start, turn: 1, units: [zhang, foe], queue: ['bolt:z'], random: () => 0, ...quiet })
    expect(struck.units.find((unit) => unit.uid === 'p')?.hp).toBe(1)
    expect(struck.strike).toMatchObject({ attackerUid: 'z', targetUid: 'p', kind: 'damage', amount: 3 })
    expect(struck.history.at(-1)).toMatchObject({ kind: 'hit', detail: { kind: 'spell', damage: 3, armor: 0 } })
    expect(struck.units.find((unit) => unit.uid === 'z')).toMatchObject({ row: 2, col: 4 })

    const warded: BoardUnit = { ...foe, card: ward, hp: ward.hp }
    const reduced = advanceBattle({ ...start, turn: 1, units: [zhang, warded], queue: ['bolt:z'], random: () => 0, ...quiet })
    expect(reduced.units.find((unit) => unit.uid === 'p')?.hp).toBe(ward.hp - 1)
    expect(reduced.strike).toMatchObject({ amount: 1 })

    const alone = advanceBattle({
      ...start,
      turn: 1,
      units: [zhang],
      queue: ['bolt:z'],
      playerHand: [{ uid: 'h', card: INFANTRY_CARD, cd: 2 }],
      playerDeck: [],
      enemyHand: [],
      enemyDeck: [],
    })
    expect(alone.strike).toBeNull()
    expect(alone.result).toBe('ongoing')
    expect(alone.units.find((unit) => unit.uid === 'z')?.hp).toBe(ZHANG_JIAO_CARD.hp)
  })

  it('一方手牌、牌库和场上都没有卡时判负并结算', () => {
    const start = yellowTurbanBattle(PLAYER_BASE_HP, BASIC_UNIT_CARDS, keepOrder)
    const player: BoardUnit = { uid: 'p', side: 'player', card: { ...INFANTRY_CARD, move: 0, atk: 9 }, row: 5, col: 4, hp: 4, entered: 1 }
    const enemy: BoardUnit = { uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 4, col: 4, hp: 1, entered: 2 }
    const empty = { playerHand: [], playerDeck: [], enemyHand: [], enemyDeck: [] }
    const won = advanceBattle({ ...start, turn: 1, units: [player, enemy], queue: ['p', 'e'], ...empty })
    expect(won.result).toBe('win')
    expect(won.enemyBaseHp).toBe(start.enemyBaseHp)
    expect(won.queue).toEqual([])
    expect(won.log).toContain('黄巾没有可战斗的卡牌')

    const fragile = { ...player, hp: 1 }
    const lost = advanceBattle({
      ...start,
      turn: 1,
      units: [fragile, enemy],
      queue: ['e'],
      playerHand: [],
      playerDeck: [],
      enemyHand: [],
      enemyDeck: [{ uid: 'left', card: INFANTRY_CARD, cd: 1 }],
    })
    expect(lost.result).toBe('lose')
    expect(lost.playerBaseHp).toBe(start.playerBaseHp)
    expect(lost.log).toContain('我方没有可战斗的卡牌')

    const held = advanceBattle({
      ...start,
      turn: 1,
      units: [fragile, enemy],
      queue: ['e'],
      playerHand: [{ uid: 'h', card: INFANTRY_CARD, cd: 2 }],
      playerDeck: [],
      enemyHand: [],
      enemyDeck: [{ uid: 'left', card: INFANTRY_CARD, cd: 1 }],
    })
    expect(held.result).toBe('ongoing')

    const drawn = advanceBattle({ ...start, units: [], queue: [], ...empty })
    expect(drawn.result).toBe('draw')
    expect(drawn.log).toContain('双方都没有可战斗的卡牌')

    const zhang: BoardUnit = { uid: 'z', side: 'enemy', card: ZHANG_JIAO_CARD, row: 2, col: 4, hp: ZHANG_JIAO_CARD.hp, entered: 1 }
    const foe: BoardUnit = { uid: 'p', side: 'player', card: INFANTRY_CARD, row: 7, col: 4, hp: 1, entered: 2 }
    const bolted = advanceBattle({ ...start, turn: 1, units: [zhang, foe], queue: ['bolt:z', 'z'], random: () => 0, ...empty })
    expect(bolted.result).toBe('lose')
    expect(bolted.queue).toEqual([])
    expect(bolted.playerBaseHp).toBe(start.playerBaseHp)
  })

  it('没有敌人可追时，贴着黄巾大本营的单位能把它击破', () => {
    const start = yellowTurbanBattle()
    const breaker: BoardUnit = {
      uid: 'p',
      side: 'player',
      card: { ...INFANTRY_CARD, atk: YELLOW_TURBAN_BASE_HP, move: 0 },
      row: 2,
      col: 8,
      hp: INFANTRY_CARD.hp,
      entered: 1,
    }
    const struck = advanceBattle({
      ...start,
      turn: 1,
      units: [breaker],
      queue: ['p'],
      playerHand: [],
      playerDeck: [],
      enemyHand: [{ uid: 'h', card: INFANTRY_CARD, cd: 3 }],
      enemyDeck: [],
    })
    expect(struck.result).toBe('win')
    expect(struck.enemyBaseHp).toBe(0)
    expect(struck.playerBaseHp).toBe(start.playerBaseHp)
    expect(struck.log).toContain('步兵 对黄巾大本营造成 10')
  })
})
