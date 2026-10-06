import { describe, expect, it } from 'vitest'
import { ALL_CARDS } from './cardCatalog'
import { BASIC_UNIT_CARDS } from './cards'
import { filterByRaceGroup, raceGroupOf, raceGroupsIn, sortDeckEntries } from './deckSort'

describe('卡组排序', () => {
  const deck = BASIC_UNIT_CARDS.map((card, index) => ({ uid: `d${index}`, card }))

  it('稀有度升序从白到红，降序反过来，冷却相同的保持原顺序', () => {
    expect(sortDeckEntries(deck, 'rarity', 'asc').map((entry) => entry.card.name)).toEqual(['步兵', '弓箭手', '火枪手', '法师', '重甲步兵', '魔卫'])
    expect(sortDeckEntries(deck, 'rarity', 'desc').map((entry) => entry.card.name)).toEqual(['重甲步兵', '魔卫', '弓箭手', '火枪手', '法师', '步兵'])
    const byCd = sortDeckEntries(deck, 'cd', 'asc').map((entry) => entry.card.name)
    expect(byCd.slice(0, 2)).toEqual(['步兵', '弓箭手'])
    expect(byCd.slice(2)).toEqual(['重甲步兵', '火枪手', '法师', '魔卫'])
  })

  it('种族按类型行的子类分组，元素单独成类，可以只看其中一类', () => {
    const card = (name: string) => ALL_CARDS.find((item) => item.name === name)!
    expect(raceGroupOf(card('步兵'))).toBe('人类')
    expect(raceGroupOf(card('攻城器械'))).toBe('矮人')
    expect(raceGroupOf(card('飞行器'))).toBe('侏儒')
    expect(raceGroupOf(card('女巫'))).toBe('高等精灵')
    expect(raceGroupOf(card('兽人步兵'))).toBe('兽人')
    expect(raceGroupOf(card('冰霜巨龙'))).toBe('亡灵')
    expect(raceGroupOf(card('女猎手'))).toBe('暗夜精灵')
    expect(raceGroupOf(card('太阳之王凯尔萨斯'))).toBe('血精灵')
    expect(raceGroupOf(card('凤凰'))).toBe('元素')
    const entries = ['冰霜巨龙', '飞行器', '步兵', '女巫', '凤凰'].map((name) => ({ card: card(name) }))
    expect(sortDeckEntries(entries, 'race', 'asc').map((entry) => entry.card.name)).toEqual(['步兵', '飞行器', '女巫', '冰霜巨龙', '凤凰'])
    expect(sortDeckEntries(entries, 'race', 'desc').map((entry) => entry.card.name)).toEqual(['凤凰', '冰霜巨龙', '女巫', '飞行器', '步兵'])
    expect(filterByRaceGroup(entries, '亡灵').map((entry) => entry.card.name)).toEqual(['冰霜巨龙'])
    const undead = filterByRaceGroup(
      ['骷髅', '憎恶', '冰霜巨龙', '巫妖王阿尔萨斯'].map((name) => ({ card: card(name) })),
      '亡灵',
    )
    expect(sortDeckEntries(undead, 'rarity', 'asc').map((entry) => entry.card.name)).toEqual(['骷髅', '憎恶', '冰霜巨龙', '巫妖王阿尔萨斯'])
    expect(sortDeckEntries(undead, 'rarity', 'desc').map((entry) => entry.card.name)).toEqual(['巫妖王阿尔萨斯', '冰霜巨龙', '憎恶', '骷髅'])
    expect(raceGroupsIn(entries.map((entry) => entry.card))).toEqual(['人类', '侏儒', '高等精灵', '亡灵', '元素'])
  })
})
