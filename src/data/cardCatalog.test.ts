import { describe, expect, it } from 'vitest'
import { findCardByName } from './cardCatalog'

describe('按名字找卡', () => {
  it('名字完全一致才找得到，空名字找不到', () => {
    expect(findCardByName(' 火枪手 ')?.name).toBe('火枪手')
    expect(findCardByName('黄巾步兵')?.id).toBe('yellow-infantry')
    expect(findCardByName('圣殿骑士')).toMatchObject({ rarity: 'purple', atk: 2, hp: 7, move: 2, speed: 2, range: 1 })
    expect(findCardByName('天公将军张角')).toMatchObject({ rarity: 'orange', profession: '法师', cd: 5, atk: 2, hp: 7, move: 2, speed: 2, range: 3 })
    expect(findCardByName('大法师')).toMatchObject({ rarity: 'purple', race: 'human', profession: '法师' })
    expect(findCardByName('水元素')).toMatchObject({ id: 'water-elemental', rarity: 'white', atk: 2, hp: 4, profession: '元素' })
    expect(findCardByName('山丘之王')).toMatchObject({ rarity: 'orange', race: 'dwarf', profession: '战士' })
    expect(findCardByName('飞行器')?.race).toBe('gnome')
    expect(findCardByName('女巫')?.race).toBe('highElf')
    expect(findCardByName('')).toBeUndefined()
    expect(findCardByName('没有这张')).toBeUndefined()
  })
})
