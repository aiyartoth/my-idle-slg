import { describe, expect, it } from 'vitest'
import { ALL_CARDS } from '../data/cardCatalog'
import { isLegendCard } from '../data/cardType'
import { lootForClears } from '../data/drops'
import { BASIC_UNIT_CARDS } from '../data/cards'
import { PLAYER_BASE_HP } from './yellowTurban'
import { CHAOS_BASE_HP, CHAOS_CARDS, CHAOS_DECK_SIZE, CHAOS_LOOT_EXP, CHAOS_LOOT_GOLD, buildChaosDeck, createChaosBattle } from './chaos'

/** 固定种子的随机数，用来统计多副牌的稀有度分布 */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('混乱时空', () => {
  it('牌池就是图鉴里的全部卡，传奇和非传奇都在', () => {
    expect(CHAOS_CARDS).toBe(ALL_CARDS)
    expect(CHAOS_CARDS.some((card) => isLegendCard(card))).toBe(true)
    expect(CHAOS_CARDS.some((card) => !isLegendCard(card))).toBe(true)
  })

  it('随机数一直最小时全是步兵，每副传奇最多一张', () => {
    const commons = buildChaosDeck(() => 0)
    expect(commons).toHaveLength(CHAOS_DECK_SIZE)
    expect(commons.every((card) => card.name === '步兵')).toBe(true)

    const random = seededRandom(11)
    for (let index = 0; index < 200; index += 1) {
      const deck = buildChaosDeck(random)
      expect(deck).toHaveLength(CHAOS_DECK_SIZE)
      expect(deck.filter((card) => isLegendCard(card)).length).toBeLessThanOrEqual(1)
    }
  })

  it('多副牌里稀有度越高越少见，橙色传奇少于紫色非传奇', () => {
    const random = seededRandom(11)
    const counts = new Map<string, number>()
    for (let index = 0; index < 400; index += 1) {
      buildChaosDeck(random).forEach((card) => counts.set(card.id, (counts.get(card.id) ?? 0) + 1))
    }
    const count = (id: string) => counts.get(id) ?? 0
    expect(count('infantry')).toBeGreaterThan(count('archer'))
    expect(count('archer')).toBeGreaterThan(count('sorceress'))
    expect(count('sorceress')).toBeGreaterThan(count('temple-knight'))
    expect(count('temple-knight')).toBeGreaterThan(count('jaina'))
    expect(count('mekkatorque')).toBeGreaterThan(count('jaina'))
  })

  it('开战用混乱时空的营和称呼', () => {
    const battle = createChaosBattle(PLAYER_BASE_HP, BASIC_UNIT_CARDS, () => 0)
    expect(battle.enemyBaseHp).toBe(CHAOS_BASE_HP)
    expect(battle.log.some((line) => line.startsWith('混乱起手'))).toBe(true)
    const names = [...battle.enemyHand, ...battle.enemyDeck].map((card) => card.card.name)
    expect(names).toEqual(Array.from({ length: CHAOS_DECK_SIZE }, () => '步兵'))
  })

  it('挂机按抽到的牌库掷卡，全中时十张步兵都掉', () => {
    const loot = lootForClears('chaos', 1, () => 0)
    expect(loot.gold).toBe(CHAOS_LOOT_GOLD)
    expect(loot.exp).toBe(CHAOS_LOOT_EXP)
    expect(loot.cards).toEqual([expect.objectContaining({ name: '步兵', count: 10 })])
  })
})
