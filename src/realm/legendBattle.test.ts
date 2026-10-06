import { describe, expect, it } from 'vitest'
import { SORCERESS_CARD } from '../data/alliance'
import { INFANTRY_CARD } from '../data/cards'
import {
  ARTHAS_CARD,
  GHOUL_CARD,
  GULDAN_CARD,
  ILLIDAN_CARD,
  INFERNAL_CARD,
  JAINA_CARD,
  KAELTHAS_CARD,
  MOGRAINE_CARD,
  MISHA_CARD,
  PHOENIX_CARD,
  REXXAR_CARD,
  THRALL_CARD,
  TYRANDE_CARD,
} from '../data/legends'
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

describe('传奇生物技能', () => {
  it('萨尔把幽灵狼补到两只，下一回合不再多召', () => {
    const first = act([unit({ uid: 't', side: 'player', card: { ...THRALL_CARD, move: 0 }, row: 2, col: 4 })], [])
    const wolves = first.units.filter((item) => item.card.id === 'ghost-wolf')
    expect(wolves).toHaveLength(2)
    expect(wolves.map((item) => `${item.row},${item.col}`).sort()).toEqual(['1,4', '3,4'])

    const second = advanceBattle({ ...first, queue: [] })
    expect(second.units.filter((item) => item.card.id === 'ghost-wolf')).toHaveLength(2)
  })

  it('闪电链最多打三个，两格外的不再跳', () => {
    const struck = act(
      [
        unit({ uid: 't', side: 'player', card: { ...THRALL_CARD, move: 0 }, row: 2, col: 0 }),
        unit({ uid: 'a', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 1 }),
        unit({ uid: 'b', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 3 }),
        unit({ uid: 'c', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5 }),
        unit({ uid: 'd', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 7 }),
      ],
      ['chain:t'],
    )
    expect(struck.units.find((item) => item.uid === 'a')?.hp).toBe(2)
    expect(struck.units.find((item) => item.uid === 'b')?.hp).toBe(2)
    expect(struck.units.find((item) => item.uid === 'c')?.hp).toBe(2)
    expect(struck.units.find((item) => item.uid === 'd')?.hp).toBe(4)
  })

  it('圣盾抵消下一次伤害，回合开始会重新套上', () => {
    const blocked = act(
      [
        unit({ uid: 'm', side: 'player', card: { ...MOGRAINE_CARD, move: 0 }, row: 2, col: 5, aegis: true }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 4 }),
      ],
      ['e'],
    )
    expect(blocked.units.find((item) => item.uid === 'm')).toMatchObject({ hp: 8, aegis: false })
    expect(blocked.log).toContain('灰烬使者莫格莱尼 的圣盾抵消了伤害')

    const refreshed = act([unit({ uid: 'm', side: 'player', card: { ...MOGRAINE_CARD, move: 0 }, row: 2, col: 5 })], [])
    expect(refreshed.units.find((item) => item.uid === 'm')?.aegis).toBe(true)
  })

  it('阿尔萨斯击杀后在该格召食尸鬼，满两只就不再召', () => {
    const raised = act(
      [
        unit({ uid: 'a', side: 'player', card: { ...ARTHAS_CARD, move: 0 }, row: 2, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5, hp: 2 }),
      ],
      ['a'],
    )
    const ghoul = raised.units.find((item) => item.card.id === 'ghoul')
    expect(ghoul).toMatchObject({ row: 2, col: 5, side: 'player' })
    expect(raised.units.find((item) => item.uid === 'e')).toBeUndefined()

    const capped = act(
      [
        unit({ uid: 'a', side: 'player', card: { ...ARTHAS_CARD, move: 0 }, row: 2, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5, hp: 2 }),
        unit({ uid: 'g1', side: 'player', card: GHOUL_CARD, row: 2, col: 2 }),
        unit({ uid: 'g2', side: 'player', card: GHOUL_CARD, row: 2, col: 3 }),
      ],
      ['a'],
    )
    expect(capped.units.filter((item) => item.card.id === 'ghoul')).toHaveLength(2)
  })

  it('伊利丹先砍身边，移动后再攻击会加上追猎的伤害', () => {
    const spun = act(
      [
        unit({ uid: 'i', side: 'player', card: { ...ILLIDAN_CARD, move: 0 }, row: 2, col: 4 }),
        unit({ uid: 'near', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5 }),
        unit({ uid: 'far', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 6 }),
      ],
      ['whirl:i'],
    )
    expect(spun.units.find((item) => item.uid === 'near')?.hp).toBe(2)
    expect(spun.units.find((item) => item.uid === 'far')?.hp).toBe(4)

    const hunted = act(
      [
        unit({ uid: 'i', side: 'player', card: ILLIDAN_CARD, row: 2, col: 2 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 4, hp: 8 }),
      ],
      ['i'],
    )
    expect(hunted.strike).toMatchObject({ amount: 6, targetUid: 'e' })
  })

  it('吉安娜的冰枪打在减速目标上会加伤', () => {
    const plain = act(
      [
        unit({ uid: 'j', side: 'player', card: { ...JAINA_CARD, move: 0 }, row: 2, col: 2 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 4 }),
      ],
      ['j'],
    )
    expect(plain.strike).toMatchObject({ amount: 3, targetUid: 'e' })

    const shattered = act(
      [
        unit({ uid: 'j', side: 'player', card: { ...JAINA_CARD, move: 0 }, row: 2, col: 2 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 4, slow: 1 }),
      ],
      ['j'],
    )
    expect(shattered.strike).toMatchObject({ amount: 5, targetUid: 'e' })
  })

  it('泰兰德给每个受伤的友方回复 1 点', () => {
    const healed = act(
      [
        unit({ uid: 'y', side: 'player', card: { ...TYRANDE_CARD, move: 0 }, row: 2, col: 2, hp: 4 }),
        unit({ uid: 'a', side: 'player', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 3, hp: 2 }),
      ],
      ['mend:y'],
    )
    expect(healed.units.find((item) => item.uid === 'y')?.hp).toBe(5)
    expect(healed.units.find((item) => item.uid === 'a')?.hp).toBe(3)
  })

  it('古尔丹付 1 点生命，对最近的敌人造成 2 点', () => {
    const tapped = act(
      [
        unit({ uid: 'g', side: 'player', card: { ...GULDAN_CARD, move: 0 }, row: 2, col: 2, hp: 5 }),
        unit({ uid: 'near', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 4 }),
        unit({ uid: 'far', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 8 }),
      ],
      ['tap:g'],
    )
    expect(tapped.units.find((item) => item.uid === 'g')?.hp).toBe(4)
    expect(tapped.units.find((item) => item.uid === 'near')?.hp).toBe(2)
    expect(tapped.units.find((item) => item.uid === 'far')?.hp).toBe(4)
    expect(tapped.log).toContain('污染者古尔丹 付出 1 点生命')
  })

  it('凯尔萨斯的炎爆击杀后跳到两格内，死亡时在原地留下凤凰', () => {
    const burst = act(
      [
        unit({ uid: 'k', side: 'player', card: { ...KAELTHAS_CARD, move: 0 }, row: 2, col: 1 }),
        unit({ uid: 'dead', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 3, hp: 2 }),
        unit({ uid: 'next', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5 }),
        unit({ uid: 'far', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 8 }),
      ],
      ['pyro:k'],
    )
    expect(burst.units.find((item) => item.uid === 'dead')).toBeUndefined()
    expect(burst.units.find((item) => item.uid === 'next')?.hp).toBe(2)
    expect(burst.units.find((item) => item.uid === 'far')?.hp).toBe(4)

    const fallen = act(
      [
        unit({ uid: 'k', side: 'enemy', card: { ...KAELTHAS_CARD, move: 0 }, row: 2, col: 4, hp: 2 }),
        unit({ uid: 'e', side: 'player', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5 }),
      ],
      ['e'],
    )
    expect(fallen.units.find((item) => item.uid === 'k')).toBeUndefined()
    expect(fallen.units.find((item) => item.card.id === 'phoenix')).toMatchObject({ row: 2, col: 4, side: 'enemy' })
  })

  it('雷克萨有米莎时普攻加伤，米莎会把攻击引过去', () => {
    const ordered = act(
      [
        unit({ uid: 'r', side: 'player', card: { ...REXXAR_CARD, move: 0 }, row: 2, col: 2 }),
        unit({ uid: 'bear', side: 'player', card: MISHA_CARD, row: 7, col: 2 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5, hp: 8 }),
      ],
      ['r'],
    )
    expect(ordered.strike).toMatchObject({ amount: 5, targetUid: 'e' })

    const plain = act(
      [
        unit({ uid: 'r', side: 'player', card: { ...REXXAR_CARD, move: 0 }, row: 2, col: 2 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5, hp: 8 }),
      ],
      ['r'],
    )
    expect(plain.strike).toMatchObject({ amount: 3, targetUid: 'e' })

    const taunted = act(
      [
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 4 }),
        unit({ uid: 'r', side: 'player', card: { ...REXXAR_CARD, move: 0 }, row: 2, col: 2 }),
        unit({ uid: 'bear', side: 'player', card: MISHA_CARD, row: 2, col: 5 }),
      ],
      ['e'],
    )
    expect(taunted.strike).toMatchObject({ targetUid: 'bear' })
  })

  it('地狱火行动开始时对相邻敌人造成 1 点法术伤害', () => {
    const burned = act(
      [
        unit({ uid: 'i', side: 'player', card: { ...INFERNAL_CARD, move: 0 }, row: 2, col: 4 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5, hp: 4 }),
      ],
      ['burn:i'],
    )
    expect(burned.units.find((item) => item.uid === 'e')?.hp).toBe(3)
  })

  it('凤凰死亡留下不能动的蛋，熬过三个回合开始后变回凤凰', () => {
    const quiet = {
      playerHand: [],
      playerDeck: [{ uid: 'pad-p', card: INFANTRY_CARD, cd: 9 }],
      enemyHand: [],
      enemyDeck: [{ uid: 'pad-e', card: INFANTRY_CARD, cd: 9 }],
    }
    let state = act(
      [
        unit({ uid: 'p', side: 'player', card: { ...PHOENIX_CARD, move: 0 }, row: 2, col: 4, hp: 1 }),
        unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0, atk: 3 }, row: 2, col: 5 }),
      ],
      ['e'],
    )
    const egg = state.units.find((item) => item.card.id === 'phoenix-egg')
    expect(egg).toMatchObject({ row: 2, col: 4, side: 'player', hatch: 3 })
    expect(egg?.card.move).toBe(0)
    for (const left of [2, 1]) {
      state = advanceBattle({ ...state, queue: [], ...quiet })
      expect(state.units.find((item) => item.uid === egg?.uid)).toMatchObject({ card: { id: 'phoenix-egg' }, hatch: left })
      expect(state.queue.some((token) => token === egg?.uid || token.endsWith(`:${egg?.uid}`))).toBe(false)
    }
    state = advanceBattle({ ...state, queue: [], ...quiet })
    expect(state.units.find((item) => item.uid === egg?.uid)?.card.id).toBe('phoenix')
  })

  it('米莎的猛锤有概率取消目标这一回合，抗性皮肤挡变形', () => {
    const start = { ...createYellowTurbanBattle(), tiles: classicRealmTiles() }
    const quiet = {
      playerHand: [],
      playerDeck: [{ uid: 'pad-p', card: INFANTRY_CARD, cd: 9 }],
      enemyHand: [],
      enemyDeck: [{ uid: 'pad-e', card: INFANTRY_CARD, cd: 9 }],
    }
    const swing = (random: () => number, queue: string[]) =>
      advanceBattle({
        ...start,
        turn: 1,
        random,
        units: [
          unit({ uid: 'bear', side: 'player', card: { ...MISHA_CARD, move: 0 }, row: 2, col: 4 }),
          unit({ uid: 'e', side: 'enemy', card: { ...INFANTRY_CARD, move: 0 }, row: 2, col: 5, hp: 6 }),
        ],
        queue,
        ...quiet,
      })
    expect(swing(() => 0, ['bear', 'e']).queue.some((token) => token === 'e' || token.endsWith(':e'))).toBe(false)
    expect(swing(() => 0, ['bear', 'e']).log.join('\n')).toContain('猛锤击晕了')
    expect(swing(() => 0.99, ['bear', 'e']).queue).toContain('e')

    const late = swing(() => 0, ['bear'])
    expect(late.units.find((item) => item.uid === 'e')?.stunned).toBe(true)
    const skipped = advanceBattle({ ...late, queue: [], ...quiet })
    expect(skipped.queue.some((token) => token === 'e' || token.endsWith(':e'))).toBe(false)
    expect(skipped.units.find((item) => item.uid === 'e')?.stunned).toBe(false)

    const sheeped = act(
      [
        unit({ uid: 's', side: 'enemy', card: { ...SORCERESS_CARD, move: 0 }, row: 2, col: 2 }),
        unit({ uid: 'bear', side: 'player', card: { ...MISHA_CARD, move: 0 }, row: 2, col: 4, hp: 3 }),
      ],
      ['poly:s'],
    )
    expect(sheeped.units.find((item) => item.uid === 'bear')?.card.id).toBe('misha')
  })
})
