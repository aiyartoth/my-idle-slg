import type { CardRarity, UnitCardData } from './cards'

/** 熔炉一次摆出的配方数。刷新也是换成这么多条 */
export const FURNACE_OFFER_COUNT = 4

/** 刷新当前这批配方要消耗的水晶 */
export const FURNACE_REFRESH_CRYSTAL = 10

/** 分解一张牌得到的水晶。稀有度越高，换得越多 */
export const CRYSTAL_BY_RARITY: Record<CardRarity, number> = {
  /** 白 */
  white: 1,
  /** 绿 */
  green: 3,
  /** 蓝 */
  blue: 10,
  /** 紫 */
  purple: 30,
  /** 橙 */
  orange: 80,
  /** 红 */
  red: 200,
}

/** 配方里一种卡牌的消耗 */
export interface FurnaceCardCost {
  cardId: string
  count: number
}

/** 配方里一种材料的消耗 */
export interface FurnaceMaterialCost {
  materialId: string
  count: number
}

/** 一条合成配方。卡牌、材料和水晶可以同时要，水晶为 0 表示不花 */
export interface FurnaceRecipe {
  id: string
  cards: readonly FurnaceCardCost[]
  materials: readonly FurnaceMaterialCost[]
  crystal: number
  resultId: string
}

/** 配方上材料 id 对应的名字，和掉落表一致 */
export const FURNACE_MATERIAL_NAME: Record<string, string> = {
  /** 木材 */
  wood: '木材',
  /** 石头 */
  stone: '石头',
  /** 铁矿石 */
  'iron-ore': '铁矿石',
}

/** 合成池。前四条是第一次打开熔炉时看到的基础配方 */
export const FURNACE_RECIPES: readonly FurnaceRecipe[] = [
  {
    id: 'heavy-infantry',
    cards: [{ cardId: 'infantry', count: 1 }],
    materials: [{ materialId: 'iron-ore', count: 10 }],
    crystal: 0,
    resultId: 'heavy-infantry',
  },
  {
    id: 'musketeer',
    cards: [{ cardId: 'archer', count: 1 }],
    materials: [{ materialId: 'wood', count: 10 }],
    crystal: 0,
    resultId: 'musketeer',
  },
  {
    id: 'ward-guard',
    cards: [{ cardId: 'mage', count: 1 }],
    materials: [{ materialId: 'stone', count: 10 }],
    crystal: 0,
    resultId: 'ward-guard',
  },
  {
    id: 'zhang-jiao',
    cards: [
      { cardId: 'yellow-infantry', count: 10 },
      { cardId: 'yellow-archer', count: 10 },
    ],
    materials: [],
    crystal: 100,
    resultId: 'zhang-jiao',
  },
  {
    id: 'knight',
    cards: [{ cardId: 'heavy-infantry', count: 1 }],
    materials: [{ materialId: 'iron-ore', count: 20 }],
    crystal: 20,
    resultId: 'knight',
  },
  {
    id: 'temple-knight',
    cards: [{ cardId: 'knight', count: 1 }],
    materials: [],
    crystal: 40,
    resultId: 'temple-knight',
  },
  {
    id: 'archmage',
    cards: [{ cardId: 'mage', count: 2 }],
    materials: [{ materialId: 'stone', count: 20 }],
    crystal: 50,
    resultId: 'archmage',
  },
  {
    id: 'paladin',
    cards: [{ cardId: 'temple-knight', count: 1 }],
    materials: [],
    crystal: 80,
    resultId: 'paladin',
  },
]

/**
 * 分解这张牌能换到的水晶。
 *
 * @param card 要分解的卡
 * @returns 水晶数量
 */
export function crystalForCard(card: UnitCardData): number {
  return CRYSTAL_BY_RARITY[card.rarity]
}

/**
 * 按配方 id 取出一条合成。
 *
 * @param id 配方 id
 * @returns 配方。池子里没有时为空
 */
export function findFurnaceRecipe(id: string): FurnaceRecipe | undefined {
  return FURNACE_RECIPES.find((recipe) => recipe.id === id)
}

/**
 * 第一次打开熔炉时的四条基础配方，不消耗水晶。
 *
 * @returns 配方 id
 */
export function starterFurnaceOfferIds(): string[] {
  return FURNACE_RECIPES.slice(0, FURNACE_OFFER_COUNT).map((recipe) => recipe.id)
}

/**
 * 从配方池里抽出不重复的一批。抽到和上一批完全一样时会再试几次。
 *
 * @param random 返回 0 到 1 的随机数
 * @param previous 上一批配方 id。没有时传空数组
 * @returns 新的一批配方 id
 */
export function rollFurnaceOfferIds(random: () => number = Math.random, previous: readonly string[] = []): string[] {
  const previousKey = offerKey(previous)
  let picked = drawOfferIds(random)
  for (let attempt = 0; attempt < 8 && offerKey(picked) === previousKey; attempt += 1) picked = drawOfferIds(random)
  return picked
}

/**
 * 无放回地抽出固定条数的配方。
 *
 * @param random 返回 0 到 1 的随机数
 * @returns 配方 id
 */
function drawOfferIds(random: () => number): string[] {
  const pool = FURNACE_RECIPES.map((recipe) => recipe.id)
  const picked: string[] = []
  while (picked.length < FURNACE_OFFER_COUNT && pool.length > 0) {
    const index = Math.min(pool.length - 1, Math.floor(random() * pool.length))
    const id = pool.splice(index, 1)[0]
    if (id) picked.push(id)
  }
  return picked
}

/**
 * 比较两批配方时忽略顺序。
 *
 * @param ids 配方 id
 * @returns 排序后拼成的键
 */
function offerKey(ids: readonly string[]): string {
  return [...ids].sort().join('|')
}
