import { describe, expect, it } from 'vitest'
import { isLegendCard } from '../data/cardType'
import { lootForClears } from '../data/drops'
import { BASIC_UNIT_CARDS } from '../data/cards'
import { PLAYER_BASE_HP } from './yellowTurban'
import {
  STORMWIND_BASE_HP,
  STORMWIND_DECK_SIZE,
  STORMWIND_LEGEND_CARDS,
  STORMWIND_LOOT_EXP,
  STORMWIND_LOOT_GOLD,
  STORMWIND_NORMAL_CARDS,
  buildStormwindDeck,
  createStormwindBattle,
} from './stormwind'

/** 固定种子的随机数，用来统计多副牌的稀有度分布 */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('暴风城', () => {
  it('牌池是指定的十种单位，传奇单独放在一组', () => {
    expect(STORMWIND_NORMAL_CARDS.map((card) => card.name)).toEqual(['步兵', '弓箭手', '法师', '牧师', '女巫', '重甲步兵', '圣殿骑士'])
    expect(STORMWIND_LEGEND_CARDS.map((card) => card.name)).toEqual(['圣骑士加文拉德', '灰烬使者莫格莱尼', '大法师吉安娜'])
    expect(STORMWIND_LEGEND_CARDS.every((card) => isLegendCard(card))).toBe(true)
    expect(STORMWIND_NORMAL_CARDS.some((card) => isLegendCard(card))).toBe(false)
  })

  it('随机数一直最小时全是步兵，一直偏大时只有一张吉安娜', () => {
    const commons = buildStormwindDeck(() => 0)
    expect(commons).toHaveLength(STORMWIND_DECK_SIZE)
    expect(commons.every((card) => card.name === '步兵')).toBe(true)

    const rares = buildStormwindDeck(() => 0.99)
    expect(rares.filter((card) => isLegendCard(card)).map((card) => card.name)).toEqual(['大法师吉安娜'])
    expect(rares.filter((card) => card.name === '圣殿骑士')).toHaveLength(9)
  })

  it('多副牌里稀有度越高越少见，每副传奇最多一张', () => {
    const random = seededRandom(7)
    const counts = new Map<string, number>()
    for (let index = 0; index < 200; index += 1) {
      const deck = buildStormwindDeck(random)
      expect(deck).toHaveLength(STORMWIND_DECK_SIZE)
      expect(deck.filter((card) => isLegendCard(card)).length).toBeLessThanOrEqual(1)
      deck.forEach((card) => counts.set(card.id, (counts.get(card.id) ?? 0) + 1))
    }
    const count = (id: string) => counts.get(id) ?? 0
    expect(count('infantry')).toBeGreaterThan(count('archer'))
    expect(count('archer')).toBeGreaterThan(count('sorceress'))
    expect(count('sorceress')).toBeGreaterThan(count('temple-knight'))
    expect(count('temple-knight')).toBeGreaterThan(count('jaina'))
    expect(count('temple-knight')).toBeGreaterThan(count('mograine'))
    expect(count('temple-knight')).toBeGreaterThan(count('paladin'))
  })

  it('开战用暴风城的营和称呼，牌库仍是抽出来的那十张', () => {
    const battle = createStormwindBattle(PLAYER_BASE_HP, BASIC_UNIT_CARDS, () => 0.99)
    expect(battle.enemyBaseHp).toBe(STORMWIND_BASE_HP)
    expect(battle.log.some((line) => line.startsWith('暴风起手'))).toBe(true)
    const names = [...battle.enemyHand, ...battle.enemyDeck].map((card) => card.card.name).sort()
    expect(names).toEqual(['圣殿骑士', '圣殿骑士', '圣殿骑士', '圣殿骑士', '圣殿骑士', '圣殿骑士', '圣殿骑士', '圣殿骑士', '圣殿骑士', '大法师吉安娜'].sort())
  })

  it('挂机按抽到的牌库掷卡，全中时十张步兵都掉', () => {
    const loot = lootForClears('stormwind', 1, () => 0)
    expect(loot.gold).toBe(STORMWIND_LOOT_GOLD)
    expect(loot.exp).toBe(STORMWIND_LOOT_EXP)
    expect(loot.cards).toEqual([expect.objectContaining({ name: '步兵', count: 10 })])
  })
})
