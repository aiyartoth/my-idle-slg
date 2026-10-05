import { describe, expect, it } from 'vitest'
import { formatLoot, rollClearLoot, YELLOW_TURBAN_DROPS } from './drops'
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

  it('天公将军张角的掉率低于普通单位', () => {
    expect(YELLOW_TURBAN_DROPS.unitChances?.['zhang-jiao']).toBe(0.1)
    const rolls = [0.5, 0.05, 0.99, 0.99, 0.99]
    let index = 0
    const loot = rollClearLoot('yellow-turban', [YELLOW_INFANTRY_CARD, ZHANG_JIAO_CARD], () => rolls[index++] ?? 0.99)
    expect(loot.cards.map((card) => card.name)).toEqual(['天公将军张角'])
  })
})
