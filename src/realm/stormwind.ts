import { PRIEST_CARD, SORCERESS_CARD } from '../data/alliance'
import { isLegendCard } from '../data/cardType'
import { BASIC_UNIT_CARDS, INFANTRY_CARD, TEMPLE_KNIGHT_CARD, type CardRarity, type UnitCardData } from '../data/cards'
import { JAINA_CARD, MOGRAINE_CARD } from '../data/legends'
import { PALADIN_CARD } from '../data/wow'
import { createBattle, type BattleState } from './battle'
import { buildRealmMap } from './realmMap'
import { PLAYER_BASE_HP } from './yellowTurban'

/** 暴风城敌方大本营生命。兵比黄巾多，营也更厚一些 */
export const STORMWIND_BASE_HP = 20

/** 暴风城胜利后的金币。战斗动画全部播完才发放 */
export const STORMWIND_LOOT_GOLD = 50

/** 暴风城胜利后的经验 */
export const STORMWIND_LOOT_EXP = 20

/** 暴风城牌库张数。按稀有度权重抽满，不再多抽 */
export const STORMWIND_DECK_SIZE = 10

/**
 * 非传奇单位的出场权重。稀有度每高一档就减半，所以白最多、紫最少。
 * 圣骑士加文拉德不在这里，他和另外两位传奇共用更低的一组权重。
 */
const NORMAL_RARITY_WEIGHT: Record<Extract<CardRarity, 'white' | 'green' | 'blue' | 'purple'>, number> = {
  /** 步兵 */
  white: 8,
  /** 弓箭手、法师、牧师 */
  green: 4,
  /** 女巫、重甲步兵 */
  blue: 2,
  /** 圣殿骑士 */
  purple: 1,
}

/** 传奇整组的出场权重。三选一，抽中之后这一副牌不再出第二张传奇 */
const LEGEND_GROUP_WEIGHT = 1

/**
 * 暴风城会出场的普通单位。同一稀有度里的先后只影响权重落在边界时抽到谁。
 */
export const STORMWIND_NORMAL_CARDS: readonly UnitCardData[] = [
  INFANTRY_CARD,
  basicCard('archer'),
  basicCard('mage'),
  PRIEST_CARD,
  SORCERESS_CARD,
  basicCard('heavy-infantry'),
  TEMPLE_KNIGHT_CARD,
]

/** 暴风城的传奇。圣骑士加文拉德、灰烬使者莫格莱尼、大法师吉安娜，整副最多一张 */
export const STORMWIND_LEGEND_CARDS: readonly UnitCardData[] = [PALADIN_CARD, MOGRAINE_CARD, JAINA_CARD]

/**
 * 组一副暴风城敌方牌库。固定 10 张。
 * 普通单位按稀有度加权，越高越少见。传奇整组权重最低，而且最多进一张。
 *
 * @param random 返回 0 到 1。测试可以传入固定值
 * @returns 洗牌前的敌方牌库
 */
export function buildStormwindDeck(random: () => number = Math.random): UnitCardData[] {
  const deck: UnitCardData[] = []
  let legendUsed = false
  for (let index = 0; index < STORMWIND_DECK_SIZE; index += 1) {
    const picked = drawStormwindCard(legendUsed, random)
    if (isLegendCard(picked)) legendUsed = true
    deck.push(picked)
  }
  return deck
}

/**
 * 暴风城的开局。敌方牌库每次开战重新按权重抽取，再和我方一起洗牌。棋盘每次重新生成，大本营仍在对角。
 *
 * @param playerBaseHp 我方大本营生命。不传时用默认值，正式开战传入等级算出的生命
 * @param playerDeck 我方卡组。不传时用基础兵种
 * @param random 抽牌、洗牌和随机地形用的随机数，返回 0 到 1
 * @returns 可以一步步推进的战斗
 */
export function createStormwindBattle(
  playerBaseHp: number = PLAYER_BASE_HP,
  playerDeck: readonly UnitCardData[] = BASIC_UNIT_CARDS,
  random: () => number = Math.random,
): BattleState {
  const enemyDeck = buildStormwindDeck(random)
  return createBattle(
    {
      playerBaseHp,
      enemyBaseHp: STORMWIND_BASE_HP,
      tiles: buildRealmMap(random),
      playerDeck,
      enemyDeck,
      enemyLabel: '暴风',
    },
    random,
  )
}

/**
 * 按当前还剩的权重抽一张。传奇名额用掉之后，只在普通单位里抽。
 *
 * @param legendUsed 这一副牌是否已经有传奇
 * @param random 返回 0 到 1
 * @returns 抽到的单位
 */
function drawStormwindCard(legendUsed: boolean, random: () => number): UnitCardData {
  const entries: { item: UnitCardData | 'legend'; weight: number }[] = STORMWIND_NORMAL_CARDS.map((card) => ({
    item: card,
    weight: weightOf(card),
  }))
  if (!legendUsed) entries.push({ item: 'legend', weight: LEGEND_GROUP_WEIGHT })
  const picked = pickWeighted(entries, random)
  if (picked !== 'legend') return picked
  const index = Math.min(STORMWIND_LEGEND_CARDS.length - 1, Math.floor(random() * STORMWIND_LEGEND_CARDS.length))
  return STORMWIND_LEGEND_CARDS[index]
}

/**
 * 普通单位用稀有度权重。传奇不走这条，避免圣骑士加文拉德被当成普通紫卡多抽。
 *
 * @param card 暴风城普通单位
 * @returns 出场权重
 */
function weightOf(card: UnitCardData): number {
  if (card.rarity !== 'white' && card.rarity !== 'green' && card.rarity !== 'blue' && card.rarity !== 'purple') {
    throw new Error(`暴风城普通单位稀有度无法加权：${card.id}`)
  }
  return NORMAL_RARITY_WEIGHT[card.rarity]
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

/**
 * 从基础兵里按 id 取出一张，给暴风城牌池用。
 *
 * @param id 基础兵的卡牌 id
 * @returns 对应的单位卡
 */
function basicCard(id: string): UnitCardData {
  const card = BASIC_UNIT_CARDS.find((item) => item.id === id)
  if (!card) throw new Error(`缺少 ${id}`)
  return card
}
