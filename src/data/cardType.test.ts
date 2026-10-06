import { describe, expect, it } from 'vitest'
import { ALL_CARDS } from './cardCatalog'
import { cardTypeLine, isMageType } from './cardType'

describe('卡面类型行', () => {
  it('按万智牌的类别和子类来写', () => {
    const line = (name: string) => cardTypeLine(ALL_CARDS.find((card) => card.name === name)!)
    expect(line('步兵')).toBe('生物-人类/步兵')
    expect(line('牧师')).toBe('生物-人类/法师/牧师')
    expect(line('女巫')).toBe('生物-高等精灵/法师/女巫')
    expect(line('破法者')).toBe('生物-高等精灵/破法者')
    expect(line('大法师')).toBe('传奇生物-人类/法师')
    expect(line('飞行器')).toBe('机械-侏儒/飞行器/载具')
    expect(line('攻城器械')).toBe('机械-矮人/攻城/载具')
    expect(line('水元素')).toBe('元素')
    expect(line('山丘之王')).toBe('传奇生物-矮人/战士')
    expect(line('迫击炮小队')).toBe('生物-矮人/炮兵')
    expect(line('狮鹫骑士')).toBe('生物-矮人/狮鹫')
    expect(line('战士')).toBe('生物-人类/战士')
    expect(line('圣骑士')).toBe('传奇生物-人类/圣骑士')
    expect(line('暗影牧师')).toBe('生物-人类/法师/牧师')
    expect(line('术士')).toBe('生物-人类/法师/术士')
    expect(line('死亡骑士')).toBe('传奇生物-人类/死亡骑士')
  })

  it('图鉴里每张牌都有类型行', () => {
    expect(ALL_CARDS.every((card) => cardTypeLine(card).length > 0)).toBe(true)
  })

  it('牧师和女巫算法师，破法者不算', () => {
    const card = (name: string) => ALL_CARDS.find((item) => item.name === name)!
    expect(isMageType(card('牧师'))).toBe(true)
    expect(isMageType(card('女巫'))).toBe(true)
    expect(isMageType(card('法师'))).toBe(true)
    expect(isMageType(card('破法者'))).toBe(false)
    expect(isMageType(card('水元素'))).toBe(false)
    expect(isMageType(card('冰霜法师'))).toBe(true)
    expect(isMageType(card('术士'))).toBe(true)
    expect(isMageType(card('暗影牧师'))).toBe(true)
    expect(isMageType(card('萨满'))).toBe(false)
    expect(isMageType(card('死亡骑士'))).toBe(false)
  })
})
