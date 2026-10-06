import { describe, expect, it } from 'vitest'
import { SPELL_BREAKER_CARD } from '../data/alliance'
import {
  ABOMINATION_CARD,
  FROST_WYRM_CARD,
  GRUNT_CARD,
  HUNTRESS_CARD,
  KODO_CARD,
  MOUNTAIN_GIANT_CARD,
  NECROMANCER_CARD,
  RAIDER_CARD,
  TAUREN_CARD,
  WITCH_DOCTOR_CARD,
} from '../data/campaign'
import { KAELTHAS_CARD, MISHA_CARD, PHOENIX_CARD } from '../data/legends'
import { INFANTRY_CARD } from '../data/cards'
import { advanceBattle, strikeDamage, type BattleState, type BoardUnit } from './battle'
import { classicRealmTiles } from './realmMap'
import { createYellowTurbanBattle } from './yellowTurban'

/**
 * 在黄巾棋盘上直接走一步。双方牌库各留一张高冷却牌，避免没牌被提前判负。
 *
 * @param units 开场就站着的兵
 * @param queue 这一步要走的队列
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
 * 摆一名测试用的兵。血量默认满血，移动力另给时写在卡面上。
 *
 * @param partial 位置、卡牌和阵营
 * @returns 场上单位
 */
function unit(partial: Omit<BoardUnit, 'hp' | 'entered'> & Partial<BoardUnit>): BoardUnit {
  return { hp: partial.hp ?? partial.card.hp, entered: partial.entered ?? 1, ...partial }
}

describe('战役兵种技能', () => {
  it('兽人步兵和山岭巨人用重甲挡物理', () => {
    expect(strikeDamage(INFANTRY_CARD, GRUNT_CARD)).toBe(1)
    expect(strikeDamage(INFANTRY_CARD, MOUNTAIN_GIANT_CARD)).toBe(0)
  })

  it('掠夺者命中后让目标减速', () => {
    const slowed = act(
      [
        unit({ uid: 'r', side: 'player', card: { ...RAIDER_CARD, move: 0 }, row: 6, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 6, col: 5 }),
      ],
      ['r'],
    )
    expect(slowed.units.find((item) => item.uid === 'e')?.slow).toBe(1)
    expect(slowed.units.find((item) => item.uid === 'e')?.hp).toBe(2)
  })

  it('巫医给每个受伤友方回复 1 点', () => {
    const healed = act(
      [
        unit({ uid: 'w', side: 'player', card: WITCH_DOCTOR_CARD, row: 2, col: 4, hp: 3 }),
        unit({ uid: 'a', side: 'player', card: INFANTRY_CARD, row: 2, col: 5, hp: 2 }),
      ],
      ['mend:w'],
    )
    expect(healed.units.find((item) => item.uid === 'w')?.hp).toBe(4)
    expect(healed.units.find((item) => item.uid === 'a')?.hp).toBe(3)
  })

  it('牛头人先对相邻敌人造成 1 点法术伤害并减速', () => {
    const clapped = act(
      [
        unit({ uid: 't', side: 'player', card: { ...TAUREN_CARD, move: 0 }, row: 3, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 3, col: 5, hp: 4 }),
      ],
      ['clap:t'],
    )
    expect(clapped.units.find((item) => item.uid === 'e')).toMatchObject({ hp: 3, slow: 1 })
  })

  it('科多兽的战鼓给身边友方加攻击，吞噬补刀低血目标', () => {
    const buffed = act(
      [
        unit({ uid: 'k', side: 'player', card: KODO_CARD, row: 7, col: 4 }),
        unit({ uid: 'a', side: 'player', card: { ...INFANTRY_CARD, move: 0 }, row: 7, col: 5 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 7, col: 6, hp: 4 }),
      ],
      ['a'],
    )
    expect(buffed.units.find((item) => item.uid === 'e')?.hp).toBe(1)

    const eaten = act(
      [
        unit({ uid: 'k', side: 'player', card: { ...KODO_CARD, move: 0 }, row: 7, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 7, col: 5, hp: 4 }),
      ],
      ['k'],
    )
    expect(eaten.units.some((item) => item.uid === 'e')).toBe(false)

    const spared = act(
      [
        unit({ uid: 'k', side: 'player', card: { ...KODO_CARD, move: 0 }, row: 7, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 7, col: 5, hp: 5 }),
      ],
      ['k'],
    )
    expect(spared.units.find((item) => item.uid === 'e')?.hp).toBe(2)

    const blocked = (card: BoardUnit['card']) =>
      act(
        [
          unit({ uid: 'k', side: 'player', card: { ...KODO_CARD, move: 0 }, row: 7, col: 4 }),
          unit({ uid: 'e', side: 'enemy', card: { ...card, move: 0 }, row: 7, col: 5, hp: 4 }),
        ],
        ['k'],
      ).units.find((item) => item.uid === 'e')?.hp
    expect(blocked(PHOENIX_CARD)).toBe(1)
    expect(blocked(KAELTHAS_CARD)).toBe(1)
    expect(blocked(SPELL_BREAKER_CARD)).toBe(1)
    expect(blocked(MISHA_CARD)).toBe(1)
  })

  it('憎恶把仇恨拉到自己身上，打中后吸血', () => {
    const foe = { ...INFANTRY_CARD, move: 0, range: 1 }
    const taunted = act(
      [
        unit({ uid: 'e', side: 'enemy', card: foe, row: 5, col: 4 }),
        unit({ uid: 'a', side: 'player', card: ABOMINATION_CARD, row: 5, col: 5 }),
        unit({ uid: 's', side: 'player', card: { ...INFANTRY_CARD, move: 0 }, row: 4, col: 4, hp: 1 }),
      ],
      ['e'],
    )
    expect(taunted.strike).toMatchObject({ attackerUid: 'e', targetUid: 'a' })

    const drank = act(
      [
        unit({ uid: 'a', side: 'player', card: { ...ABOMINATION_CARD, move: 0 }, row: 5, col: 5, hp: 6 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 6, hp: 4 }),
      ],
      ['a'],
    )
    expect(drank.units.find((item) => item.uid === 'a')?.hp).toBe(8)
    expect(drank.units.find((item) => item.uid === 'e')?.hp).toBe(1)
  })

  it('亡灵巫师击杀后在原地召唤一只骷髅', () => {
    const raised = act(
      [
        unit({ uid: 'n', side: 'player', card: { ...NECROMANCER_CARD, move: 0 }, row: 2, col: 2 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 4, hp: 1 }),
      ],
      ['n'],
    )
    const skeleton = raised.units.find((item) => item.card.id === 'skeleton')
    expect(skeleton).toMatchObject({ side: 'player', row: 2, col: 4, hp: 2 })
    expect(raised.units.some((item) => item.uid === 'e')).toBe(false)
  })

  it('女猎手的月刃溅到目标身边', () => {
    const bounced = act(
      [
        unit({ uid: 'h', side: 'player', card: { ...HUNTRESS_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 5, hp: 4 }),
        unit({ uid: 'n', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 4, col: 5, hp: 4 }),
      ],
      ['h'],
    )
    expect(bounced.units.find((item) => item.uid === 'e')?.hp).toBe(2)
    expect(bounced.units.find((item) => item.uid === 'n')?.hp).toBe(3)
  })

  it('冰霜巨龙打大本营时加上冰冻吐息', () => {
    const start = createYellowTurbanBattle()
    const struck = act([unit({ uid: 'f', side: 'player', card: { ...FROST_WYRM_CARD, move: 0 }, row: 2, col: 8 })], ['f'])
    expect(struck.enemyBaseHp).toBe(start.enemyBaseHp - 6)
    expect(struck.log).toContain('冰霜巨龙 对黄巾大本营造成 6')
  })
})
