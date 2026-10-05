import { describe, expect, it } from 'vitest'
import { lootForClears } from './drops'
import { IDLE_CAP_MS, idleClearCount } from './idle'

describe('挂机结算', () => {
  it('不足一次通关时不发奖励，超过 8 小时按 8 小时算', () => {
    expect(idleClearCount(1_000, 1_000 + 30_000, 60_000)).toEqual({ clears: 0, settledMs: 30_000 })
    const capped = idleClearCount(0, IDLE_CAP_MS + 2 * 60 * 60 * 1000, 60_000)
    expect(capped.settledMs).toBe(IDLE_CAP_MS)
    expect(capped.clears).toBe(IDLE_CAP_MS / 60_000)
  })

  it('黄巾之乱每次通关固定给金币和经验，卡牌和材料按出场概率掷', () => {
    expect(lootForClears('yellow-turban', 0).gold).toBe(0)
    const hit = lootForClears('yellow-turban', 3, () => 0)
    expect(hit.gold).toBe(90)
    expect(hit.exp).toBe(30)
    expect(hit.cards.map((card) => ({ name: card.name, count: card.count }))).toEqual([
      { name: '黄巾步兵', count: 6 },
      { name: '黄巾弓箭手', count: 3 },
      { name: '天公将军张角', count: 3 },
    ])
    expect(hit.materials.map((material) => ({ name: material.name, count: material.count }))).toEqual([
      { name: '木材', count: 3 },
      { name: '石头', count: 3 },
      { name: '铁矿石', count: 3 },
    ])
    const miss = lootForClears('yellow-turban', 3, () => 0.99)
    expect(miss.gold).toBe(90)
    expect(miss.cards).toEqual([])
    expect(miss.materials).toEqual([])
  })
})