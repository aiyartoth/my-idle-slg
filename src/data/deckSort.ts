import { cardTypeLine } from './cardType'
import { type CardRarity, type UnitCardData } from './cards'

/** 卡组排序用的字段 */
export type DeckSortKey = 'rarity' | 'race' | 'profession' | 'cd'

/** 上箭头是升序，下箭头是降序 */
export type DeckSortDir = 'asc' | 'desc'

/** 打开卡组和图鉴时默认稀有度升序，上箭头处于选中，列表会按从低到高排 */
export const DEFAULT_SORT_DIR: DeckSortDir = 'asc'

/**
 * 种族子类的固定顺序。图鉴和卡组的种族页按这个排，不按拼音。
 * 名字取自卡面类型行里连字符后的第一段，元素没有连字符就用整行。
 */
export const RACE_GROUP_ORDER = [
  /** 人类 */
  '人类',
  /** 矮人 */
  '矮人',
  /** 侏儒 */
  '侏儒',
  /** 高等精灵 */
  '高等精灵',
  /** 兽人 */
  '兽人',
  /** 亡灵 */
  '亡灵',
  /** 暗夜精灵 */
  '暗夜精灵',
  /** 血精灵 */
  '血精灵',
  /** 野兽 */
  '野兽',
  /** 恶魔 */
  '恶魔',
  /** 元素单独成类 */
  '元素',
] as const

/**
 * 这张卡在种族分类里属于哪一类。
 * 类型行「生物-人类/步兵」取人类，「元素」没有连字符就用元素。
 *
 * @param card 单位卡
 * @returns 种族子类名字
 */
export function raceGroupOf(card: UnitCardData): string {
  const line = cardTypeLine(card)
  const dash = line.indexOf('-')
  if (dash < 0) return line
  return line.slice(dash + 1).split('/')[0] || line
}

/**
 * 当前这批牌里出现过的种族子类，按固定顺序排。名单里没有的放在最后。
 *
 * @param cards 要统计的牌
 * @returns 子类名字
 */
export function raceGroupsIn(cards: readonly UnitCardData[]): string[] {
  const found = new Set(cards.map(raceGroupOf))
  const known = RACE_GROUP_ORDER.filter((name) => found.has(name))
  const knownNames = new Set<string>(RACE_GROUP_ORDER)
  const extra = [...found].filter((name) => !knownNames.has(name))
  extra.sort((left, right) => left.localeCompare(right, 'zh'))
  return [...known, ...extra]
}

/**
 * 只留某一个种族子类。不传或传空表示全部都留。
 *
 * @param entries 已经排好或还没排的条目
 * @param group 种族子类。全部时为空
 * @returns 筛过的新数组
 */
export function filterByRaceGroup<T extends { card: UnitCardData }>(entries: readonly T[], group: string | null): T[] {
  if (!group) return [...entries]
  return entries.filter((entry) => raceGroupOf(entry.card) === group)
}

/**
 * 把已经按种族排好的条目收成一组组。相邻且同类的收在一起。
 *
 * @param entries 按种族排过的条目
 * @returns 每组的名字和里面的牌
 */
export function groupByRace<T extends { card: UnitCardData }>(entries: readonly T[]): { group: string; entries: T[] }[] {
  const groups: { group: string; entries: T[] }[] = []
  entries.forEach((entry) => {
    const group = raceGroupOf(entry.card)
    const last = groups[groups.length - 1]
    if (last && last.group === group) last.entries.push(entry)
    else groups.push({ group, entries: [entry] })
  })
  return groups
}

/**
 * 种族子类在固定顺序里的位置。不认识的排到最后，彼此再按名字。
 *
 * @param group 种族子类
 * @returns 序号，越小越靠前
 */
function raceRank(group: string): number {
  const index = RACE_GROUP_ORDER.indexOf(group as (typeof RACE_GROUP_ORDER)[number])
  return index < 0 ? RACE_GROUP_ORDER.length : index
}

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
  if (key === 'race') {
    const raceDiff = raceRank(raceGroupOf(left)) - raceRank(raceGroupOf(right))
    if (raceDiff !== 0) return raceDiff
    return left.name.localeCompare(right.name, 'zh')
  }
  return left.profession.localeCompare(right.profession, 'zh')
}
