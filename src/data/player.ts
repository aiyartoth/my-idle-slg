import { realmName } from '../realm/yellowTurban'
import { INITIAL_DECK, type UnitCardData } from './cards'
import { formatLoot, lootForClears, type RealmLoot } from './drops'
import { IDLE_CAP_MS, idleClearCount, OFFLINE_SETTLE_MS, type SettlementReport } from './idle'
import { normalizeBagItem, readPlayerSave, stackBagItems, writePlayerSave, type PlayerSave } from './playerDb'

/** 开局金币。没有存档时用这个数，读到存档后以存档为准 */
export const STARTING_GOLD = 0

/** 冒险者初始等级 */
const STARTING_LEVEL = 1

/** 冒险者初始经验。达到本级升级经验后升级，剩下的留在新等级 */
const STARTING_EXP = 0

/** 每一级为大本营增加的生命。科技和神器的加成以后再加进来 */
export const HP_PER_LEVEL = 10

/** 升级经验基数。升到下一级需要的经验是当前等级乘以这个数 */
export const EXP_PER_LEVEL = 10

/** 首页日志最多留这么多条。更早的通关和失败不再显示 */
export const ACTIVITY_LOG_LIMIT = 50

/** 卡组里的一张牌。同名牌可以有多张，用 uid 区分 */
export interface DeckEntry {
  uid: string
  card: UnitCardData
}

/** 背包里的一叠卡牌。还没有强化，同名牌都叠在一起 */
export interface BagCard {
  id: string
  kind: 'card'
  card: UnitCardData
  /** 这一叠有几张 */
  count: number
}

/** 背包里的一种材料。合成系统以后再用 */
export interface BagMaterial {
  id: string
  kind: 'material'
  materialId: string
  name: string
  /** 这一叠有几个 */
  count: number
}

/** 背包里的一行。卡牌按卡牌 id 堆叠，材料按材料 id 堆叠 */
export type BagItem = BagCard | BagMaterial

/** 一个秘境的通关记录和挂机进度 */
export interface RealmProgress {
  /** 最快一次打完的耗时 */
  bestClearMs: number
  /** 正在挂机。离线也继续，单次最多结算 8 小时 */
  idling: boolean
  /** 这次还没结算的挂机从什么时候开始 */
  idleFrom: number
}

/** 首页底部的一条记录。时间单独存，展示时再收成 月/日 时:分:秒 */
export interface ActivityLogEntry {
  /** 发生时刻 */
  at: number
  /** 通关、获得或战斗失败等正文 */
  text: string
}

/** 首页和资源栏要一起读的玩家数据 */
export interface PlayerSnapshot {
  gold: number
  level: number
  exp: number
  /** 升到下一级还要攒满的经验 */
  expToNext: number
  baseHp: number
  deck: readonly DeckEntry[]
  bag: readonly BagItem[]
  realms: Readonly<Record<string, RealmProgress>>
  /** 新的在前面 */
  activityLog: readonly ActivityLogEntry[]
}

let gold = STARTING_GOLD
let level = STARTING_LEVEL
let exp = STARTING_EXP
let deckSeq = 1
let bagSeq = 1
let deck: DeckEntry[] = INITIAL_DECK.map((card) => ({ uid: `d${deckSeq++}`, card }))
let bag: BagItem[] = []
let realms: Record<string, RealmProgress> = {}
/** 首页日志。新的一条放在最前 */
let activityLog: ActivityLogEntry[] = []
/** 上次确认还在线的时刻。用来判断这次回来是不是离线超过 10 分钟 */
let lastSeenAt = 0
let settlement: SettlementReport | null = null
const listeners = new Set<() => void>()
const settlementListeners = new Set<() => void>()
let snapshot: PlayerSnapshot = capture()
/** 存档按顺序写。后一次改动不会被先发出去的写盖掉 */
let saveQueue: Promise<void> = Promise.resolve()

/**
 * 大本营生命。等级按每级固定加点，科技和神器以后再传入。
 *
 * @param adventurerLevel 冒险者等级
 * @param techHp 科技提供的生命，还没有科技时为 0
 * @param artifactHp 神器提供的生命，还没有神器时为 0
 * @returns 大本营生命
 */
export function baseHpFrom(adventurerLevel: number, techHp = 0, artifactHp = 0): number {
  return adventurerLevel * HP_PER_LEVEL + techHp + artifactHp
}

/**
 * 从当前等级升到下一级需要的经验。
 *
 * @param adventurerLevel 冒险者当前等级
 * @returns 升级经验
 */
export function expToNextLevel(adventurerLevel: number): number {
  return adventurerLevel * EXP_PER_LEVEL
}

/**
 * 当前金币。
 *
 * @returns 已经到账的金币
 */
export function getGold(): number {
  return gold
}

/**
 * 当前大本营生命。正式开战时用这个数，而不是写死的默认值。
 *
 * @returns 按等级算出的生命
 */
export function getBaseHp(): number {
  return baseHpFrom(level)
}

/**
 * 卡组里的牌，按保存顺序。进战斗时会先洗牌，不改这里的顺序。
 *
 * @returns 卡组里的牌
 */
export function getDeckCards(): UnitCardData[] {
  return deck.map((entry) => entry.card)
}

/**
 * 首页、卡组和背包共用的一份快照。
 *
 * @returns 当前玩家数据
 */
export function getPlayerSnapshot(): PlayerSnapshot {
  return snapshot
}

/**
 * 战利品金币到账。只在战斗结果出来后调用。
 *
 * @param amount 增加的金币
 */
export function addGold(amount: number): void {
  gold += amount
  emit()
}

/**
 * 战斗胜利加经验。攒满当前等级的升级经验就升级，大本营生命跟着变。
 *
 * @param amount 增加的经验
 */
export function addExp(amount: number): void {
  gainExp(amount)
  emit()
}

/**
 * 把卡组里的一张牌放回背包。
 *
 * @param uid 卡组条目的 uid
 * @returns 已放回背包时为 true
 */
export function unequipDeckCard(uid: string): boolean {
  const entry = deck.find((item) => item.uid === uid)
  if (!entry) return false
  deck = deck.filter((item) => item.uid !== uid)
  gainCards(entry.card, 1)
  emit()
  return true
}

/**
 * 把卡牌放进背包。同名牌叠成一叠，上过阵的也一样。
 *
 * @param card 掉落或下阵的卡
 * @param amount 张数
 * @returns 叠进去的那一行
 */
export function addCardToBag(card: UnitCardData, amount = 1): BagCard {
  const item = gainCards(card, amount)
  emit()
  return item
}

/**
 * 把材料放进背包。同一种材料叠在一起。
 *
 * @param materialId 材料 id
 * @param name 显示名
 * @param amount 个数
 * @returns 叠进去的那一行
 */
export function addMaterialToBag(materialId: string, name: string, amount = 1): BagMaterial {
  const item = gainMaterial(materialId, name, amount)
  emit()
  return item
}

/**
 * 使用背包里的卡牌，取一张加入卡组。材料不能上阵。
 *
 * @param itemId 背包道具 id
 * @returns 已加入卡组时为 true
 */
export function useBagCard(itemId: string): boolean {
  const item = bag.find((entry) => entry.id === itemId)
  if (!item || item.kind !== 'card' || item.count < 1) return false
  if (item.count === 1) bag = bag.filter((entry) => entry.id !== itemId)
  else bag = bag.map((entry) => (entry.id === itemId && entry.kind === 'card' ? { ...entry, count: entry.count - 1 } : entry))
  deck = [...deck, { uid: `d${deckSeq++}`, card: item.card }]
  emit()
  return true
}

/**
 * 把一场战斗的胜负写进首页日志。胜利带上这次获得的东西。
 *
 * @param name 秘境名字
 * @param result 胜、负或平局
 * @param loot 胜利掷出的战利品。失败和平局没有
 * @param at 发生时刻，测试里传入固定时间
 */
export function noteBattleResult(name: string, result: 'win' | 'lose' | 'draw', loot: RealmLoot | null, at = Date.now()): void {
  pushActivity(battleActivityText(name, result, loot), at)
  emit()
}

/**
 * 拼首页上的一行时间。月和日不补零，时分秒补零。
 *
 * @param at 发生时刻
 * @returns 如 10/5 19:57:03
 */
export function formatActivityTime(at: number): string {
  const date = new Date(at)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${hours}:${minutes}:${seconds}`
}

/**
 * 首页日志的一整行，时间和正文用冒号隔开。
 *
 * @param entry 一条记录
 * @returns 如 10/5 19:57:03: 通关[黄巾之乱], 获得:经验 10 · 金币 30
 */
export function formatActivityLine(entry: ActivityLogEntry): string {
  return `${formatActivityTime(entry.at)}: ${entry.text}`
}

/**
 * 记下一次胜利的耗时。只有更快才覆盖。
 *
 * @param realmId 秘境 id
 * @param clearMs 从开战到分出胜负的毫秒
 */
export function recordRealmClear(realmId: string, clearMs: number): void {
  if (clearMs <= 0) return
  const prev = realms[realmId]
  if (prev && prev.bestClearMs <= clearMs) return
  realms = {
    ...realms,
    [realmId]: { bestClearMs: clearMs, idling: prev?.idling ?? false, idleFrom: prev?.idleFrom ?? 0 },
  }
  emit()
}

/**
 * 有没有秘境正在挂机。离开页面时，没有挂机就提醒玩家。
 *
 * @returns 至少一个秘境在挂机时为 true
 */
export function isIdling(): boolean {
  return Object.values(realms).some((row) => row.idling)
}

/**
 * 退出前要不要问挂机。有秘境已经通关，并且当前一个都没在挂，才问。
 *
 * @param rows 各秘境进度
 * @returns 需要提示挂机时为 true
 */
export function shouldOfferIdle(rows: Readonly<Record<string, RealmProgress>>): boolean {
  const list = Object.values(rows)
  return list.some((row) => row.bestClearMs > 0) && list.every((row) => !row.idling)
}

/**
 * 把已经通关、还没挂上的秘境开始挂机。正在挂的秘境不动。
 *
 * @param now 开始时刻，测试里传入固定时间
 */
export function startClearedIdle(now = Date.now()): void {
  for (const realmId of Object.keys(realms)) {
    const row = realms[realmId]
    if (!row || row.bestClearMs <= 0 || row.idling) continue
    toggleRealmIdle(realmId, now)
  }
}

/**
 * 开始或停止这个秘境的挂机。没通关过不能挂。停止时把已经攒下的通关结算掉。
 *
 * @param realmId 秘境 id
 * @param now 操作时刻，测试里传入固定时间
 */
export function toggleRealmIdle(realmId: string, now = Date.now()): void {
  const row = realms[realmId]
  if (!row?.bestClearMs) return
  if (!row.idling) {
    realms = { ...realms, [realmId]: { ...row, idling: true, idleFrom: now } }
    emit()
    return
  }
  const report = takeRealmRewards(realmId, now)
  realms = { ...realms, [realmId]: { ...realms[realmId], idling: false, idleFrom: 0 } }
  publishSettlement(report)
  emit()
}

/**
 * 上线时看离开了多久。超过 10 分钟并且挂机够一次通关，就结算并留给浮层展示。
 *
 * @param now 上线时刻
 * @returns 需要弹出的结算；不够时间或没有奖励时为 null
 */
export function settleOfflineReturn(now = Date.now()): SettlementReport | null {
  const away = lastSeenAt > 0 ? now - lastSeenAt : 0
  lastSeenAt = now
  if (away < OFFLINE_SETTLE_MS) {
    emit()
    return null
  }
  const report = takeIdlingRewards(now)
  if (!report) {
    emit()
    return null
  }
  publishSettlement(report)
  emit()
  return report
}

/**
 * 页面还开着时刷新在线时间，避免把前台挂机误判成离线。
 *
 * @param now 当前时刻
 */
export function notePresence(now = Date.now()): void {
  lastSeenAt = now
  rememberPlayer()
}

/**
 * 当前还没关掉的离线结算。
 *
 * @returns 结算内容；没有时为 null
 */
export function getSettlement(): SettlementReport | null {
  return settlement
}

/**
 * 关掉结算浮层。奖励在弹出前已经入账。
 */
export function dismissSettlement(): void {
  settlement = null
  settlementListeners.forEach((listener) => listener())
}

/**
 * 订阅结算浮层的开关。
 *
 * @param listener 浮层内容变化时调用
 * @returns 取消订阅
 */
export function subscribeSettlement(listener: () => void): () => void {
  settlementListeners.add(listener)
  return () => {
    settlementListeners.delete(listener)
  }
}

/**
 * 背包列表上的名字。多于一张时带上数量。
 *
 * @param item 背包道具
 * @returns 列表文案
 */
export function bagItemLabel(item: BagItem): string {
  const name = item.kind === 'card' ? `卡牌: ${item.card.name}` : `材料: ${item.name}`
  return item.count > 1 ? `${name} ×${item.count}` : name
}

/**
 * 启动时读存档。没有 IndexedDB 或还没有存档时，保持开局数据。
 */
export async function loadPlayer(): Promise<void> {
  if (typeof indexedDB === 'undefined') return
  const save = await readPlayerSave()
  if (!save) return
  restorePlayer(save)
}

/**
 * 用存档盖掉内存里的玩家数据。序号会抬到已有 id 之后，避免下一张牌撞号。
 *
 * @param save 从 IndexedDB 读出的进度
 */
export function restorePlayer(save: PlayerSave): void {
  gold = save.gold
  level = save.level
  exp = save.exp
  deck = save.deck.map((entry) => ({ ...entry }))
  bag = stackBagItems(save.bag.map((item) => normalizeBagItem(item)))
  realms = { ...(save.realms ?? {}) }
  activityLog = save.activityLog ? save.activityLog.map((entry) => ({ ...entry })) : []
  lastSeenAt = save.lastSeenAt ?? 0
  deckSeq = nextSeq(deck.map((entry) => entry.uid), 'd', save.deckSeq)
  bagSeq = nextSeq(bag.map((item) => item.id), 'b', save.bagSeq)
  emit()
}

/**
 * 订阅玩家数据变化。金币、经验、卡组和背包都走这里。
 *
 * @param listener 数据变化时调用
 * @returns 取消订阅
 */
export function subscribePlayer(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * 订阅金币变化，给顶部资源栏用。
 *
 * @param listener 数值变化时调用
 * @returns 取消订阅
 */
export function subscribeGold(listener: () => void): () => void {
  return subscribePlayer(listener)
}

/**
 * 把当前数值收成一份快照，并通知订阅者。
 */
function emit(): void {
  snapshot = capture()
  listeners.forEach((listener) => listener())
  rememberPlayer()
}

/**
 * 把当前进度排队写入 IndexedDB。测试环境和不支持的浏览器里直接跳过。
 */
function rememberPlayer(): void {
  if (typeof indexedDB === 'undefined') return
  const save = currentSave()
  saveQueue = saveQueue.then(() => writePlayerSave(save)).catch(() => undefined)
}

/**
 * 收一份可写入存档的进度。牌面整份抄下来，后面升级改数值也不会丢。
 *
 * @returns 当前存档
 */
function currentSave(): PlayerSave {
  return {
    gold,
    level,
    exp,
    deckSeq,
    bagSeq,
    deck: structuredClone(deck),
    bag: structuredClone(bag),
    realms: structuredClone(realms),
    activityLog: structuredClone(activityLog),
    lastSeenAt,
  }
}

/**
 * 序号至少要比已有 id 大，存档里的序号也保留。
 *
 * @param ids 已经用过的 uid 或道具 id
 * @param prefix id 前缀，卡组是 d，背包是 b
 * @param stored 存档里记下的下一个序号
 * @returns 下一张牌可以用的序号
 */
function nextSeq(ids: readonly string[], prefix: string, stored: number): number {
  const used = ids.reduce((best, id) => {
    if (!id.startsWith(prefix)) return best
    const value = Number(id.slice(prefix.length))
    return Number.isInteger(value) ? Math.max(best, value) : best
  }, 0)
  return Math.max(stored, used + 1)
}

/**
 * 读取当前内存里的玩家数据。
 *
 * @returns 新的快照
 */
function capture(): PlayerSnapshot {
  return { gold, level, exp, expToNext: expToNextLevel(level), baseHp: baseHpFrom(level), deck, bag, realms, activityLog }
}

/**
 * 经验入账并处理升级。调用方负责通知界面。
 *
 * @param amount 增加的经验
 */
function gainExp(amount: number): void {
  exp += amount
  while (exp >= expToNextLevel(level)) {
    exp -= expToNextLevel(level)
    level += 1
  }
}

/**
 * 按卡牌 id 叠进背包。调用方负责通知界面。
 *
 * @param card 卡牌
 * @param amount 张数
 * @returns 叠进去的那一行
 */
function gainCards(card: UnitCardData, amount: number): BagCard {
  const stack = bag.find((item) => item.kind === 'card' && item.card.id === card.id)
  if (stack && stack.kind === 'card') {
    const next = { ...stack, count: stack.count + amount }
    bag = bag.map((item) => (item.id === stack.id ? next : item))
    return next
  }
  const item: BagCard = { id: `b${bagSeq++}`, kind: 'card', card, count: amount }
  bag = [...bag, item]
  return item
}

/**
 * 按材料 id 叠进背包。调用方负责通知界面。
 *
 * @param materialId 材料 id
 * @param name 显示名
 * @param amount 个数
 * @returns 叠进去的那一行
 */
function gainMaterial(materialId: string, name: string, amount: number): BagMaterial {
  const stack = bag.find((item) => item.kind === 'material' && item.materialId === materialId)
  if (stack && stack.kind === 'material') {
    const next = { ...stack, count: stack.count + amount }
    bag = bag.map((item) => (item.id === stack.id ? next : item))
    return next
  }
  const item: BagMaterial = { id: `b${bagSeq++}`, kind: 'material', materialId, name, count: amount }
  bag = [...bag, item]
  return item
}

/**
 * 结算一个正在挂机的秘境。不够一次通关时起点不动；够了只拨过已经换成奖励的时间，超过 8 小时则从现在重新计。
 *
 * @param realmId 秘境 id
 * @param now 结算时刻
 * @returns 有奖励时返回结算；不够一次通关时为 null
 */
function takeRealmRewards(realmId: string, now: number): SettlementReport | null {
  const row = realms[realmId]
  if (!row?.idling) return null
  const { clears, settledMs } = idleClearCount(row.idleFrom, now, row.bestClearMs)
  if (clears <= 0) return null
  const capped = now - row.idleFrom >= IDLE_CAP_MS
  const idleFrom = capped ? now : row.idleFrom + clears * row.bestClearMs
  realms = { ...realms, [realmId]: { ...row, idleFrom } }
  return grantClears(realmId, clears, settledMs, now)
}

/**
 * 结算所有正在挂机的秘境。
 *
 * @param now 结算时刻
 * @returns 合并后的奖励；一张都没有时为 null
 */
function takeIdlingRewards(now: number): SettlementReport | null {
  const reports = Object.keys(realms).map((realmId) => takeRealmRewards(realmId, now)).filter((report) => report !== null)
  if (reports.length === 0) return null
  return reports.reduce<SettlementReport>(
    (sum, report) => ({
      settledMs: Math.max(sum.settledMs, report.settledMs),
      gold: sum.gold + report.gold,
      exp: sum.exp + report.exp,
      clears: sum.clears + report.clears,
      cards: mergeLootCards(sum.cards, report.cards),
      materials: mergeLootMaterials(sum.materials, report.materials),
    }),
    { settledMs: 0, gold: 0, exp: 0, clears: 0, cards: [], materials: [] },
  )
}

/**
 * 把同名卡的数量并到一份结算里。
 *
 * @param current 已经记下的卡
 * @param extra 另一场的卡
 * @returns 合并后的列表
 */
function mergeLootCards(current: RealmLoot['cards'], extra: RealmLoot['cards']): RealmLoot['cards'] {
  const cards = current.map((drop) => ({ ...drop }))
  extra.forEach((drop) => {
    const found = cards.find((item) => item.card.id === drop.card.id)
    if (found) found.count += drop.count
    else cards.push({ ...drop })
  })
  return cards
}

/**
 * 把同一种材料的数量并到一份结算里。
 *
 * @param current 已经记下的材料
 * @param extra 另一场的材料
 * @returns 合并后的列表
 */
function mergeLootMaterials(current: RealmLoot['materials'], extra: RealmLoot['materials']): RealmLoot['materials'] {
  const materials = current.map((drop) => ({ ...drop }))
  extra.forEach((drop) => {
    const found = materials.find((item) => item.id === drop.id)
    if (found) found.count += drop.count
    else materials.push({ ...drop })
  })
  return materials
}

/**
 * 按通关次数发放这个秘境的战利品。调用方负责通知界面。
 *
 * @param realmId 秘境 id
 * @param clears 通关次数
 * @param settledMs 计入的挂机时长
 * @param at 写进首页日志的时刻
 * @returns 这次发放的内容
 */
function grantClears(realmId: string, clears: number, settledMs: number, at: number): SettlementReport {
  const loot = lootForClears(realmId, clears)
  pushActivity(clearActivityText(realmName(realmId), clears, loot), at)
  return grantLoot(loot, clears, settledMs)
}

/**
 * 往首页日志前面加一条，超出上限就丢掉最旧的。调用方负责通知界面。
 *
 * @param text 通关或失败的正文
 * @param at 发生时刻
 */
function pushActivity(text: string, at: number): void {
  activityLog = [{ at, text }, ...activityLog].slice(0, ACTIVITY_LOG_LIMIT)
}

/**
 * 战斗胜负在首页上的正文。
 *
 * @param name 秘境名字
 * @param result 胜、负或平局
 * @param loot 胜利时的战利品
 * @returns 不含时间的一行
 */
function battleActivityText(name: string, result: 'win' | 'lose' | 'draw', loot: RealmLoot | null): string {
  if (result === 'lose') return '战斗失败'
  if (result === 'draw') return '战斗平局'
  return clearActivityText(name, 1, loot)
}

/**
 * 通关在首页上的正文。多次挂机通关会标出次数。
 *
 * @param name 秘境名字
 * @param clears 这次折算的通关次数
 * @param loot 这次获得的东西
 * @returns 不含时间的一行
 */
function clearActivityText(name: string, clears: number, loot: RealmLoot | null): string {
  const title = clears > 1 ? `通关[${name}] ×${clears}` : `通关[${name}]`
  if (!loot) return title
  return `${title}, 获得:${formatLoot(loot)}`
}

/**
 * 把一场战斗掷出的战利品入账。
 *
 * @param loot 这场的金币、经验、卡牌和材料
 */
export function grantBattleLoot(loot: RealmLoot): void {
  grantLoot(loot, 1, 0)
  emit()
}

/**
 * 把一份战利品记到玩家身上。调用方负责通知界面。
 *
 * @param loot 金币、经验、卡牌和材料
 * @param clears 折算的通关次数。单场战斗记 1
 * @param settledMs 挂机计入的时长。单场战斗记 0
 * @returns 结算浮层要显示的内容
 */
function grantLoot(loot: RealmLoot, clears: number, settledMs: number): SettlementReport {
  gold += loot.gold
  gainExp(loot.exp)
  loot.cards.forEach((drop) => gainCards(drop.card, drop.count))
  loot.materials.forEach((drop) => gainMaterial(drop.id, drop.name, drop.count))
  return { settledMs, gold: loot.gold, exp: loot.exp, clears, cards: loot.cards, materials: loot.materials }
}

/**
 * 让结算浮层显示这份奖励。没有实际收获时不弹。
 *
 * @param report 结算内容
 */
function publishSettlement(report: SettlementReport | null): void {
  if (!report || (report.gold === 0 && report.exp === 0 && report.cards.length === 0 && report.materials.length === 0)) return
  settlement = report
  settlementListeners.forEach((listener) => listener())
}

