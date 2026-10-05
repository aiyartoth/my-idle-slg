import type { UnitCardData } from '../data/cards'
import { rollClearLoot, type RealmLoot } from '../data/drops'
import { getBaseHp, getDeckCards, grantBattleLoot, noteBattleResult, recordRealmClear } from '../data/player'
import { advanceBattle, type BattleState } from './battle'
import { createYellowTurbanBattle, realmName } from './yellowTurban'

/** 后台推进一拍的间隔。离开战斗页也不会停 */
const TURN_GAP_MS = 900

/** 胜负分出后，战斗界面最多再停留的时间 */
export const BATTLE_LEAVE_MS = 5000

/** 没有战斗。上一场战果已经确认，或玩家已经退出秘境 */
interface IdleSession {
  status: 'idle'
}

/** 正在打，人在不在战斗页都继续走 */
interface RunningSession {
  status: 'running'
  realmId: string
  battle: BattleState
}

/** 已经分出胜负，玩家还没确认。首页秘境入口回到列表，不再跳进这场战斗 */
interface UnconfirmedSession {
  status: 'unconfirmed'
  realmId: string
  battle: BattleState
  rewarded: boolean
  /** 胜利时掷出的战利品。失败和平局是空的 */
  loot: RealmLoot | null
  /** 分出胜负的时刻。战斗界面从这时起最多再停 5 秒 */
  endedAt: number
}

/** 当前这场秘境战斗。页面卸掉以后还留在这里 */
export type BattleSession = IdleSession | RunningSession | UnconfirmedSession

let session: BattleSession = { status: 'idle' }
let snapshot: BattleSession = session
let timer = 0
let viewers = 0
let settledStamp = -1
/** 这场开战的时刻。胜利时用它算通关耗时 */
let battleStartedAt = 0
const listeners = new Set<() => void>()

/**
 * 当前战斗。没有进行中的战斗时是 idle。
 *
 * @returns 会话快照
 */
export function getSession(): BattleSession {
  return snapshot
}

/**
 * 这场秘境还在打。首页用它跳过列表，直接回到战场。打完或退出之后不再跳过。
 *
 * @returns 该直接进入战斗页时为 true
 */
export function hasOpenBattle(): boolean {
  return session.status === 'running'
}

/**
 * 订阅战斗变化。后台每走一拍都会通知。
 *
 * @param listener 局面变化时调用
 * @returns 取消订阅
 */
export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * 进入黄巾之乱。已经有一场没确认的战斗时不另开。
 */
export function ensureYellowTurbanBattle(): void {
  if (session.status !== 'idle') return
  battleStartedAt = Date.now()
  publish({
    status: 'running',
    realmId: 'yellow-turban',
    battle: createYellowTurbanBattle(getBaseHp(), getDeckCards()),
  })
  if (!timer) timer = window.setInterval(tick, TURN_GAP_MS)
}

/**
 * 战斗页挂上时调用。人离开页面不会停下战斗；若人走的时候胜负已分，就立刻发放奖励。
 *
 * @returns 页面卸载时调用
 */
export function retainBattleView(): () => void {
  viewers += 1
  return () => {
    viewers -= 1
    if (viewers === 0) grantIfReady()
  }
}

/**
 * 战斗页把这一步的动画播完了。正在看的时候，奖励等到这一步。
 *
 * @param stamp 播完的局面序号
 */
export function markBattleSettled(stamp: number): void {
  settledStamp = stamp
  grantIfReady()
}

/**
 * 玩家确认战果。之后秘境入口回到列表，可以再开一场。
 */
export function confirmBattle(): void {
  closeSession()
}

/**
 * 退出这场秘境。已经分出胜负的会先结清奖励；还在打的停掉，不发奖励。
 * 之后首页再点秘境会进入列表。
 */
export function exitBattle(): void {
  closeSession()
}

/**
 * 结束当前会话。胜负已分时补发奖励，并把入口恢复成空闲。
 */
function closeSession(): void {
  if (session.status === 'unconfirmed') {
    settledStamp = session.battle.history.length
    grantIfReady()
  }
  window.clearInterval(timer)
  timer = 0
  settledStamp = -1
  publish({ status: 'idle' })
}

/**
 * 后台走一拍。分出胜负后停表，奖励等动画播完；没人在看就马上发。
 */
function tick(): void {
  if (session.status !== 'running') return
  const next = advanceBattle(session.battle)
  if (next.result === 'ongoing') {
    publish({ status: 'running', realmId: session.realmId, battle: next })
    return
  }
  window.clearInterval(timer)
  timer = 0
  settledStamp = -1
  publish({ status: 'unconfirmed', realmId: session.realmId, battle: next, rewarded: false, loot: null, endedAt: Date.now() })
  grantIfReady()
}

/**
 * 离自动离开战斗界面还要等多久。已经超过 5 秒就马上走。
 *
 * @param endedAt 分出胜负的时刻
 * @param now 当前时刻
 * @returns 还要等待的毫秒，不会超过 5 秒
 */
export function battleLeaveDelay(endedAt: number, now: number): number {
  return Math.max(0, BATTLE_LEAVE_MS - (now - endedAt))
}

/**
 * 胜利时按这场实际出场的敌方单位掷卡牌，再掷材料。同一场只发一次。胜负和平局都会写进首页日志。
 */
function grantIfReady(): void {
  if (session.status !== 'unconfirmed' || session.rewarded) return
  if (viewers > 0 && settledStamp !== session.battle.history.length) return
  const battle = session.battle
  const realmId = session.realmId
  const loot = battle.result === 'win' ? rollClearLoot(realmId, appearedEnemies(battle)) : null
  publish({ ...session, rewarded: true, loot })
  if (battle.result === 'win' || battle.result === 'lose' || battle.result === 'draw') {
    noteBattleResult(realmName(realmId), battle.result, loot)
  }
  if (battle.result !== 'win' || !loot) return
  if (battleStartedAt > 0) recordRealmClear(realmId, Date.now() - battleStartedAt)
  grantBattleLoot(loot)
}

/**
 * 找出这场战斗里召唤出来的敌方单位。每只独立参与掉落。
 *
 * @param battle 已经结束的战斗
 * @returns 敌方上场记录，同一张牌出场几次就出现几次
 */
function appearedEnemies(battle: BattleState): UnitCardData[] {
  return battle.history.flatMap((event) => (event.kind === 'summon' && event.actor.side === 'enemy' ? [event.actor.card] : []))
}

/**
 * 换成新会话并通知页面。
 *
 * @param next 新会话
 */
function publish(next: BattleSession): void {
  session = next
  snapshot = next
  listeners.forEach((listener) => listener())
}
