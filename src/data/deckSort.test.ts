import { describe, expect, it } from 'vitest'
import { BASIC_UNIT_CARDS } from './cards'
import { sortDeckEntries } from './deckSort'

describe('卡组排序', () => {
  const deck = BASIC_UNIT_CARDS.map((card, index) => ({ uid: `d${index}`, card }))

  it('稀有度升序从白到红，降序反过来，冷却相同的保持原顺序', () => {
    expect(sortDeckEntries(deck, 'rarity', 'asc').map((entry) => entry.card.name)).toEqual(['步兵', '弓箭手', '火枪手', '法师', '重甲步兵', '魔卫'])
    expect(sortDeckEntries(deck, 'rarity', 'desc').map((entry) => entry.card.name)).toEqual(['重甲步兵', '魔卫', '弓箭手', '火枪手', '法师', '步兵'])
    const byCd = sortDeckEntries(deck, 'cd', 'asc').map((entry) => entry.card.name)
    expect(byCd.slice(0, 2)).toEqual(['步兵', '弓箭手'])
    expect(byCd.slice(2)).toEqual(['重甲步兵', '火枪手', '法师', '魔卫'])
  })
})
