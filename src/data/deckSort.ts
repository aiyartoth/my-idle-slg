import { RACE_LABEL, type CardRarity, type UnitCardData } from './cards'

/** 卡组排序用的字段 */
export type DeckSortKey = 'rarity' | 'race' | 'profession' | 'cd'

/** 上箭头是升序，下箭头是降序 */
export type DeckSortDir = 'asc' | 'desc'

/** 打开卡组和图鉴时默认稀有度升序，上箭头处于选中，列表会按从低到高排 */
export const DEFAULT_SORT_DIR: DeckSortDir = 'asc'

/** 稀有度从低到高。升序按这个序号排 */
const RARITY_RANK: Record<CardRarity, number> = {
  /** 白 */
  white: 0,
  /** 绿 */
  green: 1,
  /** 蓝 */
  blue: 2,
  /** 紫 */
  purple: 3,
  /** 橙 */
  orange: 4,
  /** 红 */
  red: 5,
}

/**
 * 按选定字段给卡组排序。相同的牌保持原来的先后。
 *
 * @param entries 当前卡组
 * @param key 稀有度、种族、职业或冷却
 * @param dir 升序或降序
 * @returns 排好的新数组，不改动原来的卡组
 */
export function sortDeckEntries<T extends { card: UnitCardData }>(entries: readonly T[], key: DeckSortKey, dir: DeckSortDir): T[] {
  const sign = dir === 'asc' ? 1 : -1
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const diff = compareCards(left.entry.card, right.entry.card, key) * sign
      return diff === 0 ? left.index - right.index : diff
    })
    .map((item) => item.entry)
}

/**
 * 两张牌在某个字段上的先后。负数表示左边更小。
 *
 * @param left 左边的牌
 * @param right 右边的牌
 * @param key 比较用的字段
 * @returns 比较结果
 */
function compareCards(left: UnitCardData, right: UnitCardData, key: DeckSortKey): number {
  if (key === 'rarity') return RARITY_RANK[left.rarity] - RARITY_RANK[right.rarity]
  if (key === 'cd') return left.cd - right.cd
  if (key === 'race') return RACE_LABEL[left.race].localeCompare(RACE_LABEL[right.race], 'zh')
  return left.profession.localeCompare(right.profession, 'zh')
}
