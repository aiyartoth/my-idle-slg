import type { LootCard, LootMaterial } from './drops'

/** 离线挂机最多结算这么久。再久的时间不再产奖励 */
export const IDLE_CAP_MS = 8 * 60 * 60 * 1000

/** 离开超过这个时间再上线，才弹出离线结算 */
export const OFFLINE_SETTLE_MS = 10 * 60 * 1000

/** 上线或停止挂机时要展示的一份战利品 */
export interface SettlementReport {
  /** 这次实际结算的时长，已经按 8 小时封顶 */
  settledMs: number
  gold: number
  exp: number
  cards: LootCard[]
  materials: LootMaterial[]
  /** 各秘境折算了多少次通关 */
  clears: number
}

/**
 * 一段挂机能折算几次通关。不足一次的零头留下次，超过 8 小时的部分不算。
 *
 * @param idleFrom 这次未结算挂机的起点
 * @param now 结算时刻
 * @param bestClearMs 最快通关耗时
 * @returns 可以发放的通关次数，以及实际计入的时长
 */
export function idleClearCount(idleFrom: number, now: number, bestClearMs: number): { clears: number; settledMs: number } {
  if (bestClearMs <= 0 || now <= idleFrom) return { clears: 0, settledMs: 0 }
  const settledMs = Math.min(now - idleFrom, IDLE_CAP_MS)
  return { clears: Math.floor(settledMs / bestClearMs), settledMs }
}

/**
 * 把毫秒收成列表上的通关时间。
 *
 * @param ms 耗时
 * @returns 如 45秒、1分05秒、2小时03分
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${hours}小时${String(minutes).padStart(2, '0')}分`
  if (minutes > 0) return `${minutes}分${String(seconds).padStart(2, '0')}秒`
  return `${seconds}秒`
}
