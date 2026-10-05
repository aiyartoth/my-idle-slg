import { useEffect, useSyncExternalStore } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { getGold, isIdling, notePresence, settleOfflineReturn, subscribeGold } from '../data/player'
import { OfflineSettlement } from './OfflineSettlement'

/** 前台时刷新在线时间的间隔。用来区分真的离线 */
const PRESENCE_MS = 30_000

/** 关闭页面前的提醒。浏览器会用自己的文案再问一次 */
const LEAVE_WITHOUT_IDLE = '当前没有挂机，离开后无法获得离线收益'

/**
 * 游戏外框。资源栏钉在顶部，中间内容滚动。入口改在首页，不再放底部导航。
 *
 * @returns 套了资源栏的页面
 */
export function AppShell() {
  useEffect(() => {
    const onHide = () => notePresence()
    const onShow = () => {
      if (document.visibilityState === 'visible') settleOfflineReturn()
      else notePresence()
    }
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') notePresence()
    }, PRESENCE_MS)
    const onLeave = (event: BeforeUnloadEvent) => {
      if (isIdling()) return
      event.preventDefault()
      event.returnValue = LEAVE_WITHOUT_IDLE
    }
    document.addEventListener('visibilitychange', onShow)
    window.addEventListener('pagehide', onHide)
    window.addEventListener('beforeunload', onLeave)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onShow)
      window.removeEventListener('pagehide', onHide)
      window.removeEventListener('beforeunload', onLeave)
    }
  }, [])
  return (
    <div className="relative mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#1a1613] text-[#f4efe6]">
      <ResourceBar />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
        <Outlet />
      </main>
      <OfflineSettlement />
    </div>
  )
}

/**
 * 顶部资源。左边是金币，不在首页时右边可以回到首页。回到首页不会把正在打的战斗停掉。
 *
 * @returns 资源栏
 */
function ResourceBar() {
  const gold = useSyncExternalStore(subscribeGold, getGold)
  const atHome = useLocation().pathname === '/'
  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[#3a322b] bg-[#1a1613] px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#2a241f] px-3 py-1.5" aria-label={`金币 ${gold}`}>
        <CoinIcon />
        <span className="text-xs tracking-wide text-[#c8b49a]">金币</span>
        <span className="text-sm font-semibold tabular-nums">{gold}</span>
      </div>
      {atHome ? null : (
        <Link to="/" className="text-sm text-[#f4efe6]">
          回到首页
        </Link>
      )}
    </header>
  )
}

/**
 * 金币图标。资源栏上用来和后面会加的其他资源区分。
 *
 * @returns 图标
 */
function CoinIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill="#e6c36a" />
      <circle cx="8" cy="8" r="5" fill="none" stroke="#8d6844" strokeWidth="1" />
    </svg>
  )
}
