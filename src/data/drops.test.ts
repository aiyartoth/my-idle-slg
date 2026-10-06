import { describe, expect, it } from 'vitest'
import { formatLoot, LEGEND_DROP_CHANCE, rollClearLoot, YELLOW_TURBAN_DROPS } from './drops'
import { YELLOW_ARCHER_CARD, YELLOW_INFANTRY_CARD, ZHANG_JIAO_CARD } from '../realm/yellowTurban'

describe('掉落', () => {
  it('黄巾之乱掉木材、石头和铁矿石，只有上场的单位才掷卡', () => {
    expect(YELLOW_TURBAN_DROPS.materials.map((material) => material.name)).toEqual(['木材', '石头', '铁矿石'])
    const loot = rollClearLoot('yellow-turban', [YELLOW_INFANTRY_CARD, YELLOW_ARCHER_CARD], () => 0)
    expect(loot.cards.map((card) => card.name)).toEqual(['黄巾步兵', '黄巾弓箭手'])
    expect(formatLoot(loot)).toContain('材料: 木材')
    expect(formatLoot(loot)).toContain('材料: 铁矿石')
    const missed = rollClearLoot('yellow-turban', [YELLOW_INFANTRY_CARD], () => 0.99)
    expect(missed.cards).toEqual([])
    expect(missed.materials).toEqual([])
    expect(missed.gold).toBe(YELLOW_TURBAN_DROPS.gold)
  })

  it('传奇卡的掉率低于普通单位', () => {
    expect(LEGEND_DROP_CHANCE).toBe(0.02)
    const hitRolls = [0.5, 0.019, 0.99, 0.99, 0.99]
    let index = 0
    const loot = rollClearLoot('yellow-turban', [YELLOW_INFANTRY_CARD, ZHANG_JIAO_CARD], () => hitRolls[index++] ?? 0.99)
    expect(loot.cards.map((card) => card.name)).toEqual(['天公将军张角'])
    const missRolls = [0.49, 0.02, 0.99, 0.99, 0.99]
    index = 0
    const missed = rollClearLoot('yellow-turban', [YELLOW_INFANTRY_CARD, ZHANG_JIAO_CARD], () => missRolls[index++] ?? 0.99)
    expect(missed.cards.map((card) => card.name)).toEqual(['黄巾步兵'])
  })
})
