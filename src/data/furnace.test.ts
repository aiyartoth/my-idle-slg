import { describe, expect, it } from 'vitest'
import { findCardById } from './cardCatalog'
import { CRYSTAL_BY_RARITY, FURNACE_MATERIAL_NAME, FURNACE_OFFER_COUNT, FURNACE_RECIPES, FURNACE_REFRESH_CRYSTAL, findFurnaceRecipe, rollFurnaceOfferIds, starterFurnaceOfferIds } from './furnace'

describe('熔炉配方', () => {
  it('基础配方是步兵升重甲，以及黄巾兵加水晶换张角', () => {
    expect(findFurnaceRecipe('heavy-infantry')).toMatchObject({
      cards: [{ cardId: 'infantry', count: 1 }],
      materials: [{ materialId: 'iron-ore', count: 10 }],
      crystal: 0,
      resultId: 'heavy-infantry',
    })
    expect(findFurnaceRecipe('zhang-jiao')).toMatchObject({
      cards: [
        { cardId: 'yellow-infantry', count: 10 },
        { cardId: 'yellow-archer', count: 10 },
      ],
      materials: [],
      crystal: 100,
      resultId: 'zhang-jiao',
    })
    expect(FURNACE_RECIPES.length).toBeGreaterThan(FURNACE_OFFER_COUNT)
    expect(starterFurnaceOfferIds()).toEqual(['heavy-infantry', 'musketeer', 'ward-guard', 'zhang-jiao'])
    expect(FURNACE_REFRESH_CRYSTAL).toBe(10)
    expect(CRYSTAL_BY_RARITY.white).toBe(1)
    FURNACE_RECIPES.forEach((recipe) => {
      expect(findCardById(recipe.resultId)?.name).toBeTruthy()
      recipe.cards.forEach((cost) => expect(findCardById(cost.cardId)?.name).toBeTruthy())
      recipe.materials.forEach((cost) => expect(FURNACE_MATERIAL_NAME[cost.materialId]).toBeTruthy())
    })
  })

  it('刷新抽出四条不重复的配方，并尽量避开上一批', () => {
    const next = rollFurnaceOfferIds(() => 0.99, starterFurnaceOfferIds())
    expect(next).toHaveLength(FURNACE_OFFER_COUNT)
    expect(new Set(next).size).toBe(FURNACE_OFFER_COUNT)
    expect([...next].sort().join('|')).not.toBe([...starterFurnaceOfferIds()].sort().join('|'))
  })
})