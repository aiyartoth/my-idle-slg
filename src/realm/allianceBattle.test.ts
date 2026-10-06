import { describe, expect, it } from 'vitest'
import {
  ARCHMAGE_CARD,
  FLYING_MACHINE_CARD,
  GRYPHON_RIDER_CARD,
  KNIGHT_CARD,
  MORTAR_TEAM_CARD,
  MOUNTAIN_KING_CARD,
  PRIEST_CARD,
  SIEGE_ENGINE_CARD,
  SORCERESS_CARD,
  SPELL_BREAKER_CARD,
  WATER_ELEMENTAL_CARD,
} from '../data/alliance'
import { BASIC_UNIT_CARDS, INFANTRY_CARD } from '../data/cards'
import { advanceBattle, explainStrike, type BattleState, type BoardUnit } from './battle'
import { classicRealmTiles } from './realmMap'
import { createYellowTurbanBattle } from './yellowTurban'

/**
 * 在黄巾棋盘上直接走一步。双方牌库各留一张高冷却牌，避免没牌被提前判负。
 *
 * @param units 开场就站着的兵
 * @param queue 这一步要走的队列。空队列会先开新回合
 * @returns 走完这一步的局面
 */
function act(units: BoardUnit[], queue: string[]): BattleState {
  const start = createYellowTurbanBattle()
  return advanceBattle({
    ...start,
    tiles: classicRealmTiles(),
    turn: 1,
    units,
    queue,
    playerHand: [],
    playerDeck: [{ uid: 'pad-p', card: INFANTRY_CARD, cd: 9 }],
    enemyHand: [],
    enemyDeck: [{ uid: 'pad-e', card: INFANTRY_CARD, cd: 9 }],
  })
}

/**
 * 摆一名测试用的兵。血量和上场顺序可以另给。
 *
 * @param partial 位置、卡牌和阵营。血量默认满血
 * @returns 场上单位
 */
function unit(partial: Omit<BoardUnit, 'hp' | 'entered'> & Partial<BoardUnit>): BoardUnit {
  return { hp: partial.hp ?? partial.card.hp, entered: partial.entered ?? 1, ...partial }
}

describe('人类阵营技能', () => {
  it('骑士移动后冲锋加伤，站着打就只有面板攻击', () => {
    const charging = act(
      [
        unit({ uid: 'k', side: 'player', card: { ...KNIGHT_CARD, move: 2 }, row: 2, col: 5 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 1, col: 7, hp: 9 }),
      ],
      ['k'],
    )
    expect(charging.strike).toMatchObject({ amount: 5, targetUid: 'e' })
    expect(charging.units.find((item) => item.uid === 'e')?.hp).toBe(4)

    const standing = act(
      [
        unit({ uid: 'k', side: 'player', card: { ...KNIGHT_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 4, col: 4, hp: 9 }),
      ],
      ['k'],
    )
    expect(standing.strike).toMatchObject({ amount: 3, targetUid: 'e' })
  })

  it('牧师先治疗再点心灵之火，加攻打出去后消失', () => {
    const priest = unit({ uid: 'p', side: 'player', card: PRIEST_CARD, row: 7, col: 4, hp: 3 })
    const opened = act([priest], [])
    expect(opened.queue).toEqual(['heal:p', 'fire:p', 'p'])

    const hurt = unit({ uid: 'a', side: 'player', card: INFANTRY_CARD, row: 7, col: 5, hp: 1, entered: 2 })
    const healed = act([priest, hurt], ['heal:p'])
    expect(healed.units.find((item) => item.uid === 'a')?.hp).toBe(3)

    const fired = act([priest, hurt], ['fire:p'])
    expect(fired.units.find((item) => item.uid === 'a')?.bonusAtk).toBe(1)
    expect(fired.log[0]).toContain('攻击 +1')

    const buffed = unit({ uid: 'a', side: 'player', card: { ...INFANTRY_CARD, move: 0 }, row: 7, col: 5, hp: 4, bonusAtk: 1 })
    const foe = unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 7, col: 6, hp: 6 })
    const struck = act([buffed, foe], ['a'])
    expect(struck.strike).toMatchObject({ amount: 3, targetUid: 'e' })
    expect(struck.units.find((item) => item.uid === 'a')?.bonusAtk).toBe(0)

    const again = act([priest, { ...hurt, bonusAtk: 1 }], ['fire:p'])
    expect(again.units.find((item) => item.uid === 'a')?.bonusAtk).toBe(1)
    expect(again.log[0]).toContain('没有叠加')
  })

  it('女巫把低血敌人变羊，法术免疫不受变形和减速', () => {
    const witch = unit({ uid: 's', side: 'player', card: SORCERESS_CARD, row: 5, col: 4 })
    const weak = unit({ uid: 'e', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 6, hp: 3 })
    const tough = unit({ uid: 't', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 2, hp: 4 })
    const changed = act([witch, weak, tough], ['poly:s'])
    expect(changed.units.find((item) => item.uid === 'e')).toMatchObject({ hp: 2, card: { id: 'sheep', atk: 0 } })
    expect(changed.units.find((item) => item.uid === 't')?.card.id).toBe('infantry')

    const breaker = unit({ uid: 'b', side: 'enemy', card: SPELL_BREAKER_CARD, row: 5, col: 5, hp: 2 })
    const warded = act([witch, breaker], ['poly:s'])
    expect(warded.units.find((item) => item.uid === 'b')?.card.id).toBe('spell-breaker')

    const slowed = act(
      [
        unit({ uid: 's', side: 'player', card: { ...SORCERESS_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 5, hp: 6 }),
      ],
      ['s'],
    )
    expect(slowed.units.find((item) => item.uid === 'e')?.slow).toBe(1)

    const immune = act(
      [
        unit({ uid: 's', side: 'player', card: { ...SORCERESS_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'b', side: 'enemy', card: SPELL_BREAKER_CARD, row: 5, col: 5, hp: 5 }),
      ],
      ['s'],
    )
    expect(immune.units.find((item) => item.uid === 'b')).toMatchObject({ hp: 5 })
    expect(immune.units.find((item) => item.uid === 'b')?.slow).toBeUndefined()
  })

  it('变形术持续到本回合结束，下回合变回原兵', () => {
    const witch = unit({ uid: 's', side: 'player', card: { ...SORCERESS_CARD, move: 0 }, row: 5, col: 4 })
    const weak = unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 6, hp: 3 })
    const changed = act([witch, weak], ['poly:s', 'e'])
    expect(changed.units.find((item) => item.uid === 'e')?.card.id).toBe('sheep')

    const acted = advanceBattle(changed)
    expect(acted.units.find((item) => item.uid === 'e')).toMatchObject({ hp: 2, card: { id: 'sheep' } })

    const next = advanceBattle(acted)
    expect(next.turn).toBe(2)
    expect(next.units.find((item) => item.uid === 'e')).toMatchObject({ hp: 2, card: { id: 'infantry', atk: 2 } })
    expect(next.units.find((item) => item.uid === 'e')?.trueForm).toBeUndefined()
    expect(next.log).toContain('绵羊 变回了 步兵')
  })

  it('减速会少走一格，并在下回合压低行动顺序，行动后消失', () => {
    const slowed = act([unit({ uid: 'e', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 4, slow: 1 })], ['e'])
    expect(slowed.units.find((item) => item.uid === 'e')).toMatchObject({ row: 6, col: 4, slow: 0 })
    const free = act([unit({ uid: 'e', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 4 })], ['e'])
    expect(free.units.find((item) => item.uid === 'e')).toMatchObject({ row: 7, col: 4 })

    const late = act(
      [
        unit({ uid: 'p', side: 'player', card: { ...INFANTRY_CARD, speed: 3 }, row: 7, col: 3, slow: 1, entered: 2 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, speed: 3 }, row: 2, col: 4, entered: 3 }),
      ],
      [],
    )
    expect(late.queue[0]).toBe('e')
    const early = act(
      [
        unit({ uid: 'p', side: 'player', card: { ...INFANTRY_CARD, speed: 3 }, row: 7, col: 3, entered: 2 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, speed: 3 }, row: 2, col: 4, entered: 3 }),
      ],
      [],
    )
    expect(early.queue[0]).toBe('p')
  })

  it('破法者免疫法术，打法师时反馈加伤', () => {
    const mage = BASIC_UNIT_CARDS.find((card) => card.id === 'mage')
    if (!mage) throw new Error('缺卡')
    expect(explainStrike(mage, SPELL_BREAKER_CARD)).toMatchObject({ damage: 0 })
    expect(explainStrike(SPELL_BREAKER_CARD, mage)).toMatchObject({ extraAtk: 2, damage: 5 })
    expect(explainStrike(SPELL_BREAKER_CARD, PRIEST_CARD)).toMatchObject({ extraAtk: 2 })
    expect(explainStrike(SPELL_BREAKER_CARD, SORCERESS_CARD)).toMatchObject({ extraAtk: 2 })
    expect(explainStrike(SPELL_BREAKER_CARD, INFANTRY_CARD).damage).toBe(3)
    expect(explainStrike(SPELL_BREAKER_CARD, WATER_ELEMENTAL_CARD).extraAtk).toBe(0)
  })

  it('迫击炮溅射相邻敌人，重甲能挡住碎片', () => {
    const heavy = BASIC_UNIT_CARDS.find((card) => card.id === 'heavy-infantry')
    if (!heavy) throw new Error('缺卡')
    const struck = act(
      [
        unit({ uid: 'm', side: 'player', card: { ...MORTAR_TEAM_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 5, hp: 9 }),
        unit({ uid: 'n', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 6, hp: 4 }),
        unit({ uid: 'f', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 8, hp: 4 }),
        unit({ uid: 'h', side: 'enemy', card: { ...heavy, move: 0 }, row: 6, col: 5, hp: heavy.hp }),
      ],
      ['m'],
    )
    expect(struck.units.find((item) => item.uid === 'e')?.hp).toBe(5)
    expect(struck.units.find((item) => item.uid === 'n')?.hp).toBe(2)
    expect(struck.units.find((item) => item.uid === 'f')?.hp).toBe(4)
    expect(struck.units.find((item) => item.uid === 'h')?.hp).toBe(heavy.hp)
  })

  it('攻城器械和狮鹫骑士打大本营时加上炮击', () => {
    const tank = act([unit({ uid: 't', side: 'player', card: { ...SIEGE_ENGINE_CARD, move: 0 }, row: 3, col: 8 })], ['t'])
    expect(tank.enemyBaseHp).toBe(4)
    expect(tank.strike).toMatchObject({ amount: 6 })

    const gryphon = act([unit({ uid: 'g', side: 'player', card: { ...GRYPHON_RIDER_CARD, move: 0 }, row: 2, col: 8 })], ['g'])
    expect(gryphon.strike).toMatchObject({ amount: 6 })
  })

  it('飞行器可以落到河流上，不能飞的同移动力过不去', () => {
    const flown = act([unit({ uid: 'f', side: 'player', card: FLYING_MACHINE_CARD, row: 5, col: 0 })], ['f'])
    expect(flown.routes[0]?.path.some((cell) => flown.tiles[cell.row][cell.col] === 'river')).toBe(true)

    const walked = act([unit({ uid: 'f', side: 'player', card: { ...FLYING_MACHINE_CARD, skills: [] }, row: 5, col: 0 })], ['f'])
    expect(walked.routes[0]?.path.some((cell) => walked.tiles[cell.row][cell.col] === 'river' || walked.tiles[cell.row][cell.col] === 'stone')).toBe(false)
  })

  it('大法师开回合召水元素，暴风雪打范围内的敌人，光环让身边的人先动', () => {
    const mage = unit({ uid: 'a', side: 'player', card: ARCHMAGE_CARD, row: 5, col: 4 })
    const opened = act([mage], [])
    const pet = opened.units.find((item) => item.card.id === 'water-elemental')
    expect(pet?.side).toBe('player')
    expect(Math.abs((pet?.row ?? 0) - 5) + Math.abs((pet?.col ?? 0) - 4)).toBe(1)
    expect(opened.queue).toContain('storm:a')

    const ward = BASIC_UNIT_CARDS.find((card) => card.id === 'ward-guard')
    if (!ward) throw new Error('缺卡')
    const snow = act(
      [
        mage,
        unit({ uid: 'n', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 6, hp: 4 }),
        unit({ uid: 'f', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 8, hp: 4 }),
        unit({ uid: 'w', side: 'enemy', card: ward, row: 4, col: 4, hp: ward.hp }),
        unit({ uid: 'b', side: 'enemy', card: SPELL_BREAKER_CARD, row: 6, col: 4, hp: 5 }),
      ],
      ['storm:a'],
    )
    expect(snow.units.find((item) => item.uid === 'n')?.hp).toBe(2)
    expect(snow.units.find((item) => item.uid === 'f')?.hp).toBe(4)
    expect(snow.units.find((item) => item.uid === 'w')?.hp).toBe(ward.hp)
    expect(snow.units.find((item) => item.uid === 'b')?.hp).toBe(5)

    const aura = { ...ARCHMAGE_CARD, skills: ARCHMAGE_CARD.skills.filter((skill) => skill.kind === 'aura') }
    const boosted = act(
      [
        unit({ uid: 'a', side: 'player', card: aura, row: 5, col: 4, entered: 4 }),
        unit({ uid: 'p', side: 'player', card: { ...INFANTRY_CARD, speed: 2 }, row: 5, col: 5, entered: 5 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, speed: 2 }, row: 2, col: 2, entered: 1 }),
      ],
      [],
    )
    expect(boosted.queue[0]).toBe('a')
    expect(boosted.queue.indexOf('p')).toBeLessThan(boosted.queue.indexOf('e'))
    const plain = act(
      [
        unit({ uid: 'a', side: 'player', card: { ...ARCHMAGE_CARD, skills: [] }, row: 5, col: 4, entered: 4 }),
        unit({ uid: 'p', side: 'player', card: { ...INFANTRY_CARD, speed: 2 }, row: 5, col: 5, entered: 5 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, speed: 2 }, row: 2, col: 2, entered: 1 }),
      ],
      [],
    )
    expect(plain.queue[0]).toBe('e')
  })

  it('山丘之王的风暴之锤打断最近的人，雷霆一击减速邻格，重击取消剩余行动', () => {
    const king = unit({ uid: 'm', side: 'player', card: MOUNTAIN_KING_CARD, row: 5, col: 4 })
    const bolted = act(
      [
        king,
        unit({ uid: 'n', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 5, hp: 6 }),
        unit({ uid: 'f', side: 'enemy', card: INFANTRY_CARD, row: 2, col: 2, hp: 6 }),
      ],
      ['hammer:m', 'm', 'n', 'f'],
    )
    expect(bolted.units.find((item) => item.uid === 'n')?.hp).toBe(4)
    expect(bolted.units.find((item) => item.uid === 'f')?.hp).toBe(6)
    expect(bolted.queue).not.toContain('n')
    expect(bolted.queue).toContain('f')

    const blocked = act(
      [king, unit({ uid: 'b', side: 'enemy', card: SPELL_BREAKER_CARD, row: 5, col: 5, hp: 5 })],
      ['hammer:m', 'b'],
    )
    expect(blocked.units.find((item) => item.uid === 'b')?.hp).toBe(5)
    expect(blocked.queue).toContain('b')

    const clapped = act(
      [
        unit({ uid: 'm', side: 'player', card: MOUNTAIN_KING_CARD, row: 5, col: 4 }),
        unit({ uid: 'n', side: 'enemy', card: INFANTRY_CARD, row: 5, col: 5, hp: 6 }),
        unit({ uid: 'd', side: 'enemy', card: INFANTRY_CARD, row: 4, col: 5, hp: 6 }),
        unit({ uid: 'b', side: 'enemy', card: SPELL_BREAKER_CARD, row: 6, col: 4, hp: 5 }),
      ],
      ['clap:m'],
    )
    expect(clapped.units.find((item) => item.uid === 'n')).toMatchObject({ hp: 4, slow: 1 })
    expect(clapped.units.find((item) => item.uid === 'd')).toMatchObject({ hp: 6 })
    expect(clapped.units.find((item) => item.uid === 'd')?.slow).toBeUndefined()
    expect(clapped.units.find((item) => item.uid === 'b')).toMatchObject({ hp: 5 })
    expect(clapped.units.find((item) => item.uid === 'b')?.slow).toBeUndefined()

    const bashed = act(
      [
        unit({ uid: 'm', side: 'player', card: { ...MOUNTAIN_KING_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 5, hp: 9 }),
      ],
      ['m', 'e'],
    )
    expect(bashed.strike).toMatchObject({ amount: 3, targetUid: 'e' })
    expect(bashed.queue).toEqual([])
  })
})
