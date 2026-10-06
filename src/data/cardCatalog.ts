import { YELLOW_ARCHER_CARD, YELLOW_INFANTRY_CARD, ZHANG_JIAO_CARD } from '../realm/yellowTurban'
import { ALLIANCE_CARDS } from './alliance'
import { BASIC_UNIT_CARDS, TEMPLE_KNIGHT_CARD, type UnitCardData } from './cards'
import { CAMPAIGN_CARDS, CAMPAIGN_TOKEN_CARDS } from './campaign'
import { LEGEND_CARDS, LEGEND_TOKEN_CARDS } from './legends'
import { SIDE_RACE_CARDS } from './sideRaces'
import { WOW_CARDS } from './wow'

/** 已经设计的全部卡牌。GM 按名字查找，图鉴也用这份名单 */
export const ALL_CARDS: readonly UnitCardData[] = [
  ...BASIC_UNIT_CARDS,
  TEMPLE_KNIGHT_CARD,
  ...ALLIANCE_CARDS,
  ...WOW_CARDS,
  ...LEGEND_CARDS,
  ...LEGEND_TOKEN_CARDS,
  ...CAMPAIGN_CARDS,
  ...CAMPAIGN_TOKEN_CARDS,
  ...SIDE_RACE_CARDS,
  YELLOW_INFANTRY_CARD,
  YELLOW_ARCHER_CARD,
  ZHANG_JIAO_CARD,
]

/**
 * 按卡牌名字找出一张牌。前后空格不算，名字要完全一致。
 *
 * @param name 玩家输入的卡牌名字
 * @returns 对应的卡。没有这张牌时为空
 */
export function findCardByName(name: string): UnitCardData | undefined {
  const trimmed = name.trim()
  if (!trimmed) return undefined
  return ALL_CARDS.find((card) => card.name === trimmed)
}

/**
 * 按卡牌 id 找出一张牌。熔炉配方用 id 指向结果和材料卡。
 *
 * @param id 卡牌 id
 * @returns 对应的卡。没有这张牌时为空
 */
export function findCardById(id: string): UnitCardData | undefined {
  return ALL_CARDS.find((card) => card.id === id)
}
