import { ALL_CARDS } from '../data/cardCatalog'
import { isLegendCard } from '../data/cardType'
import { BASIC_UNIT_CARDS, type CardRarity, type UnitCardData } from '../data/cards'
import { createBattle, type BattleState } from './battle'
import { buildRealmMap } from './realmMap'
import { PLAYER_BASE_HP } from './yellowTurban'

/** 混乱时空敌方大本营生命。牌比暴风城杂，营先按同一档 */
export const CHAOS_BASE_HP = 20

/** 混乱时空胜利后的金币。战斗动画全部播完才发放 */
export const CHAOS_LOOT_GOLD = 50

/** 混乱时空胜利后的经验 */
export const CHAOS_LOOT_EXP = 20

/** 混乱时空牌库张数。从全部卡里按权重抽满 */
export const CHAOS_DECK_SIZE = 10

/**
 * 每张牌的出场权重。稀有度每高一档就减半，红最低。
 * 传奇也按这张表算，但一副牌抽到一张传奇后，其余传奇都退出。
 */
const RARITY_WEIGHT: Record<CardRarity, number> = {
  /** 步兵、召唤物 */
  white: 32,
  /** 弓箭手、技师 */
  green: 16,
  /** 女巫、龙鹰 */
  blue: 8,
  /** 圣殿骑士、紫色传奇 */
  purple: 4,
  /** 橙色传奇 */
  orange: 2,
  /** 还没有红卡，先留最低一档 */
  red: 1,
}

/**
 * 混乱时空会出场的全部卡，就是图鉴。传奇和非传奇都在里面。
 */
export const CHAOS_CARDS: readonly UnitCardData[] = ALL_CARDS

/**
 * 组一副混乱时空敌方牌库。固定 10 张。
 * 全部卡按稀有度加权，越高越少见。传奇最多一张，抽到之后只在非传奇里继续抽。
 *
 * @param random 返回 0 到 1。测试可以传入固定值
 * @returns 洗牌前的敌方牌库
 */
export function buildChaosDeck(random: () => number = Math.random): UnitCardData[] {
  const deck: UnitCardData[] = []
  let legendUsed = false
  for (let index = 0; index < CHAOS_DECK_SIZE; index += 1) {
    const pool = legendUsed ? CHAOS_CARDS.filter((card) => !isLegendCard(card)) : CHAOS_CARDS
    const picked = pickWeighted(
      pool.map((card) => ({ item: card, weight: RARITY_WEIGHT[card.rarity] })),
      random,
    )
    if (isLegendCard(picked)) legendUsed = true
    deck.push(picked)
  }
  return deck
}

/**
 * 混乱时空的开局。敌方牌库每次开战重新按权重抽取，再和我方一起洗牌。棋盘每次重新生成，大本营仍在对角。
 *
 * @param playerBaseHp 我方大本营生命。不传时用默认值，正式开战传入等级算出的生命
 * @param playerDeck 我方卡组。不传时用基础兵种
 * @param random 抽牌、洗牌和随机地形用的随机数，返回 0 到 1
 * @returns 可以一步步推进的战斗
 */
export function createChaosBattle(
  playerBaseHp: number = PLAYER_BASE_HP,
  playerDeck: readonly UnitCardData[] = BASIC_UNIT_CARDS,
  random: () => number = Math.random,
): BattleState {
  const enemyDeck = buildChaosDeck(random)
  return createBattle(
    {
      playerBaseHp,
      enemyBaseHp: CHAOS_BASE_HP,
      tiles: buildRealmMap(random),
      playerDeck,
      enemyDeck,
      enemyLabel: '混乱',
    },
    random,
  )
}

/**
 * 按权重抽一项。随机数为 0 时落在第一项。
 *
 * @param entries 候选项和权重。权重都要大于 0
 * @param random 返回 0 到 1
 * @returns 抽中的项
 */
function pickWeighted<T>(entries: readonly { item: T; weight: number }[], random: () => number): T {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  let roll = random() * total
  for (const entry of entries) {
    roll -= entry.weight
    if (roll < 0) return entry.item
  }
  return entries[entries.length - 1].item
}
