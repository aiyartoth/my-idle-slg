import { describe, expect, it } from 'vitest'
import { INFANTRY_CARD } from '../data/cards'
import { DEATH_KNIGHT_CARD, PALADIN_CARD, WARRIOR_CARD } from '../data/wow'
import { advanceBattle, type BattleState, type BoardUnit } from './battle'
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

describe('魔兽世界职业技能', () => {
  it('斩杀只在目标生命不超过点数时加伤', () => {
    const low = act(
      [
        unit({ uid: 'w', side: 'player', card: { ...WARRIOR_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 5, hp: 2 }),
      ],
      ['w'],
    )
    expect(low.strike).toMatchObject({ amount: 5, targetUid: 'e' })
    expect(low.units.find((item) => item.uid === 'e')).toBeUndefined()

    const healthy = act(
      [
        unit({ uid: 'w', side: 'player', card: { ...WARRIOR_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 5, hp: 4 }),
      ],
      ['w'],
    )
    expect(healthy.strike).toMatchObject({ amount: 3, targetUid: 'e' })
    expect(healthy.units.find((item) => item.uid === 'e')?.hp).toBe(1)
  })

  it('吸血按点数回复自己，并且不超过上限', () => {
    const drained = act(
      [
        unit({ uid: 'd', side: 'player', card: { ...DEATH_KNIGHT_CARD, move: 0 }, row: 5, col: 4, hp: 6 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 5, hp: 6 }),
      ],
      ['d'],
    )
    expect(drained.units.find((item) => item.uid === 'd')?.hp).toBe(8)
    expect(drained.units.find((item) => item.uid === 'e')).toMatchObject({ hp: 3, slow: 1 })
    expect(drained.log).toContain('死亡骑士达里安 吸取 2 点生命')

    const full = act(
      [
        unit({ uid: 'd', side: 'player', card: { ...DEATH_KNIGHT_CARD, move: 0 }, row: 5, col: 4, hp: 8 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 5, hp: 6 }),
      ],
      ['d'],
    )
    expect(full.units.find((item) => item.uid === 'd')?.hp).toBe(8)
    expect(full.log.some((line) => line.includes('吸取'))).toBe(false)
  })

  it('嘲讽让敌人改打坦克，并朝坦克靠近', () => {
    const struck = act(
      [
        unit({ uid: 'a', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 5, col: 4 }),
        unit({ uid: 'p', side: 'player', card: { ...PALADIN_CARD, move: 0 }, row: 5, col: 5, hp: 7 }),
        unit({ uid: 'i', side: 'player', card: { ...INFANTRY_CARD, move: 0 }, row: 4, col: 4, hp: 1 }),
      ],
      ['a'],
    )
    expect(struck.strike).toMatchObject({ targetUid: 'p', amount: 1 })

    const pulled = act(
      [
        unit({ uid: 'a', side: 'player', card: INFANTRY_CARD, row: 5, col: 4 }),
        unit({ uid: 'p', side: 'enemy', card: { ...PALADIN_CARD, move: 0 }, row: 7, col: 4 }),
      ],
      ['a'],
    )
    expect(pulled.units.find((item) => item.uid === 'a')).toMatchObject({ row: 6, col: 4 })
  })
})
