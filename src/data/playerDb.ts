import type { ActivityLogEntry, BagItem, DeckEntry, RealmProgress } from './player'
import { findCardById } from './cardCatalog'

/** 读档时最多留下的日志条数，和首页展示上限一致 */
const SAVED_ACTIVITY_LIMIT = 50
import { ensureCardRarity, type UnitCardData } from './cards'

/** 存档库名。只放这名玩家的进度，和代码里的卡牌表分开 */
const DB_NAME = 'my-idle-slg'

/** 库结构版本。存档里加上秘境进度和在线时间时升到 2 */
const DB_VERSION = 2

/** 玩家进度所在的表 */
const PLAYER_STORE = 'player'

/** 当前这份存档的键。现在只有一份进度 */
const PLAYER_SAVE_KEY = 'profile'

/** 写进 IndexedDB 的玩家进度。升级经验和大本营生命由等级现算，不另存 */
export interface PlayerSave {
  gold: number
  level: number
  exp: number
  /** 下一张卡组牌的序号，避免刷新后 uid 和旧牌撞上 */
  deckSeq: number
  /** 下一件背包道具的序号 */
  bagSeq: number
  deck: DeckEntry[]
  bag: BagItem[]
  /** 各秘境的最快通关和挂机。旧档没有这项 */
  realms?: Record<string, RealmProgress>
  /** 上次还在线的时刻。旧档没有这项 */
  lastSeenAt?: number
  /** 首页底部日志。旧档没有这项 */
  activityLog?: ActivityLogEntry[]
  /** 熔炉水晶。旧档没有这项 */
  crystal?: number
  /** 熔炉当前展示的配方 id。旧档没有这项 */
  furnaceOffers?: string[]
}

let dbPromise: Promise<IDBDatabase> | null = null

/**
 * 打开玩家存档库。第一次会建表，之后复用同一个连接。
 *
 * @returns 已打开的数据库
 */
function openPlayerDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PLAYER_STORE)) db.createObjectStore(PLAYER_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })
  return dbPromise
}

/**
 * 读出当前存档。没有存档，或内容对不上，就当没有。
 *
 * @returns 可用存档；没有或损坏时为 null
 */
export async function readPlayerSave(): Promise<PlayerSave | null> {
  const db = await openPlayerDb()
  const record = await requestToPromise(db.transaction(PLAYER_STORE, 'readonly').objectStore(PLAYER_STORE).get(PLAYER_SAVE_KEY))
  return playerSaveFrom(record)
}

/**
 * 把一份进度写入存档，盖掉上一份。
 *
 * @param save 当前玩家进度
 */
export async function writePlayerSave(save: PlayerSave): Promise<void> {
  const db = await openPlayerDb()
  const store = db.transaction(PLAYER_STORE, 'readwrite').objectStore(PLAYER_STORE)
  await requestToPromise(store.put(save, PLAYER_SAVE_KEY))
}

/**
 * 判断一段未知数据是不是玩家存档。坏档不拿来盖内存。
 *
 * @param value IndexedDB 里读出的值
 * @returns 结构完整时为这份存档，否则为 null
 */
export function playerSaveFrom(value: unknown): PlayerSave | null {
  if (!value || typeof value !== 'object') return null
  const save = value as Partial<PlayerSave>
  if (!isCount(save.gold) || !isCount(save.level) || save.level < 1 || !isCount(save.exp)) return null
  if (!isCount(save.deckSeq) || !isCount(save.bagSeq)) return null
  if (!Array.isArray(save.deck) || !Array.isArray(save.bag)) return null
  if (!save.deck.every(isDeckEntry) || !save.bag.every(isBagItem)) return null
  return migrateLegacySave({
    gold: save.gold,
    level: save.level,
    exp: save.exp,
    deckSeq: save.deckSeq,
    bagSeq: save.bagSeq,
    deck: save.deck,
    bag: save.bag,
    realms: save.realms === undefined ? undefined : realmMapFrom(save.realms),
    lastSeenAt: isCount(save.lastSeenAt) ? save.lastSeenAt : undefined,
    activityLog: Array.isArray(save.activityLog) ? activityLogFrom(save.activityLog) : undefined,
    crystal: isCount(save.crystal) ? save.crystal : undefined,
    furnaceOffers: Array.isArray(save.furnaceOffers) ? furnaceOffersFrom(save.furnaceOffers) : undefined,
  })
}

/**
 * 把开发期旧档收成当前结构。正式版上线后删掉这一处，读档和恢复进度都不再改写存档。
 * 图鉴里有的牌换成当前配置，名字、稀有度、种族和技能跟着图鉴走。
 * 图鉴没有的牌只补稀有度。背包里拆开的同名牌叠回去。缺的进度字段补空。
 *
 * @param save 结构已经核对过的存档
 * @returns 收成当前结构的存档
 */
export function migrateLegacySave(save: PlayerSave): PlayerSave {
  return {
    gold: save.gold,
    level: save.level,
    exp: save.exp,
    deckSeq: save.deckSeq,
    bagSeq: save.bagSeq,
    deck: save.deck.map((entry) => ({ ...entry, card: syncSavedCard(entry.card) })),
    bag: stackBagItems(save.bag.map((item) => normalizeBagItem(item))),
    realms: save.realms ?? {},
    lastSeenAt: save.lastSeenAt ?? 0,
    activityLog: save.activityLog ?? [],
    crystal: save.crystal ?? 0,
    furnaceOffers: save.furnaceOffers ?? [],
  }
}

/**
 * 旧档里的牌对齐图鉴。认识的牌用图鉴当前这张，不认识的只补稀有度。
 *
 * @param card 存档里的单位卡
 * @returns 对齐后的单位卡
 */
function syncSavedCard(card: UnitCardData): UnitCardData {
  return findCardById(card.id) ?? ensureCardRarity(card)
}

/**
 * 补齐背包行。旧档里拆开的同名牌会在读档时再叠回去，因为还没有强化。
 *
 * @param item 存档里的背包行
 * @returns 带张数的背包行
 */
export function normalizeBagItem(item: BagItem): BagItem {
  if (item.kind === 'material') return { ...item, count: item.count >= 1 ? item.count : 1 }
  const count = typeof item.count === 'number' && item.count >= 1 ? item.count : 1
  return { id: item.id, kind: 'card', card: syncSavedCard(item.card), count }
}

/**
 * 把同名卡、同种材料各自叠成一行。
 *
 * @param items 还没合并的背包
 * @returns 叠好的背包
 */
export function stackBagItems(items: readonly BagItem[]): BagItem[] {
  const stacked: BagItem[] = []
  items.forEach((item) => {
    if (item.kind === 'material') {
      const found = stacked.find((row) => row.kind === 'material' && row.materialId === item.materialId)
      if (found && found.kind === 'material') found.count += item.count
      else stacked.push({ ...item })
      return
    }
    const found = stacked.find((row) => row.kind === 'card' && row.card.id === item.card.id)
    if (found && found.kind === 'card') found.count += item.count
    else stacked.push({ ...item })
  })
  return stacked
}

/**
 * 把 IndexedDB 请求收成 Promise。
 *
 * @param request 一次读或写
 * @returns 请求结果
 */
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * 非负整数。金币、等级、经验和序号都用这个口径。
 *
 * @param value 待检查的值
 * @returns 是非负整数时为 true
 */
function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

/**
 * 卡组里的一张牌。uid 和牌面都要在。
 *
 * @param value 待检查的值
 * @returns 是卡组条目时为 true
 */
function isDeckEntry(value: unknown): value is DeckEntry {
  if (!value || typeof value !== 'object') return false
  const entry = value as Partial<DeckEntry>
  return typeof entry.uid === 'string' && entry.uid.length > 0 && isUnitCard(entry.card)
}

/**
 * 背包里的一件卡牌道具。
 *
 * @param value 待检查的值
 * @returns 是卡牌道具时为 true
 */
function isBagItem(value: unknown): value is BagItem {
  if (!value || typeof value !== 'object') return false
  const item = value as Partial<BagItem> & { instanceId?: string }
  if (typeof item.id !== 'string' || item.id.length === 0) return false
  if (item.count !== undefined && (typeof item.count !== 'number' || !Number.isInteger(item.count) || item.count < 1)) return false
  if (item.kind === 'material') return typeof item.materialId === 'string' && item.materialId.length > 0 && typeof item.name === 'string' && item.name.length > 0
  if (item.kind !== 'card' || !isUnitCard(item.card)) return false
  return true
}

/**
 * 读出首页日志。某一条坏了就丢掉，并且只留最近的若干条。
 *
 * @param value 存档里的 activityLog
 * @returns 可用的日志，新的在前面
 */
function activityLogFrom(value: unknown): ActivityLogEntry[] {
  if (!Array.isArray(value)) return []
  const entries: ActivityLogEntry[] = []
  value.forEach((item) => {
    if (!item || typeof item !== 'object') return
    const entry = item as Partial<ActivityLogEntry>
    if (!isCount(entry.at) || typeof entry.text !== 'string' || entry.text.length === 0) return
    entries.push({ at: entry.at, text: entry.text })
  })
  return entries.slice(0, SAVED_ACTIVITY_LIMIT)
}

/**
 * 读出熔炉正在展示的配方。不是字符串的丢掉，剩下的交给熔炉再核对。
 *
 * @param value 存档里的 furnaceOffers
 * @returns 配方 id
 */
function furnaceOffersFrom(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const ids: string[] = []
  value.forEach((item) => {
    if (typeof item === 'string' && item.length > 0) ids.push(item)
  })
  return ids
}

/**
 * 读出秘境进度。某一条坏了就丢掉，不影响整份存档。
 *
 * @param value 存档里的 realms
 * @returns 可用的进度
 */
function realmMapFrom(value: unknown): Record<string, RealmProgress> {
  if (!value || typeof value !== 'object') return {}
  const realms: Record<string, RealmProgress> = {}
  Object.entries(value).forEach(([id, row]) => {
    if (!row || typeof row !== 'object') return
    const progress = row as Partial<RealmProgress>
    if (typeof progress.bestClearMs !== 'number' || !Number.isInteger(progress.bestClearMs) || progress.bestClearMs < 1) return
    if (typeof progress.idling !== 'boolean') return
    if (typeof progress.idleFrom !== 'number' || !Number.isInteger(progress.idleFrom) || progress.idleFrom < 0) return
    realms[id] = { bestClearMs: progress.bestClearMs, idling: progress.idling, idleFrom: progress.idleFrom }
  })
  return realms
}

/**
 * 一张单位卡。只核对后面还要拿来展示和开战的字段。
 *
 * @param value 待检查的值
 * @returns 是单位卡时为 true
 */
function isUnitCard(value: unknown): value is UnitCardData {
  if (!value || typeof value !== 'object') return false
  const card = value as Partial<UnitCardData>
  return typeof card.id === 'string' && typeof card.name === 'string' && typeof card.atk === 'number' && typeof card.hp === 'number' && Array.isArray(card.skills)
}
