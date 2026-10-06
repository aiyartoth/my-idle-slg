import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { getPlayerSnapshot, shouldOfferIdle, startClearedIdle, subscribePlayer } from '../data/player'
import { parentPath } from './backNav'

/** 从屏幕左右边缘起手，才当成系统侧滑，避免挡住列表滚动 */
const EDGE_PX = 28

/** 向内滑过这么多像素才回上一级 */
const SWIPE_PX = 48

/**
 * 退出游戏。装在手机里时关掉应用，浏览器里关不掉标签。
 */
function leaveGame(): void {
  if (Capacitor.isNativePlatform()) void App.exitApp()
}

/**
 * 手机侧滑、系统返回和浏览器后退都走同一条：有上一级就回去，首页则询问是否退出。
 * 已经通关但还没挂机时，顺带问要不要先挂上。
 *
 * @param props.shellRef 游戏外框，侧滑只认这根柱子的左右边缘
 * @returns 首页退出弹层；没弹时不占画面
 */
export function PhoneBack({ shellRef }: { shellRef: RefObject<HTMLElement | null> }) {
  const navigate = useNavigate()
  const location = useLocation()
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const pathRef = useRef(location.pathname)
  const exitOpenRef = useRef(false)
  const [exitOpen, setExitOpen] = useState(false)
  pathRef.current = location.pathname
  exitOpenRef.current = exitOpen
  const offerIdle = shouldOfferIdle(player.realms)

  const goBack = () => {
    if (exitOpenRef.current) {
      setExitOpen(false)
      return
    }
    const parent = parentPath(pathRef.current)
    if (!parent) {
      setExitOpen(true)
      return
    }
    navigate(parent, { replace: true })
  }
  const goBackRef = useRef(goBack)
  goBackRef.current = goBack

  useEffect(() => {
    const onPop = () => {
      const from = pathRef.current
      window.setTimeout(() => {
        if (exitOpenRef.current) {
          setExitOpen(false)
          navigate('/', { replace: true })
          return
        }
        const parent = parentPath(from)
        if (!parent) {
          setExitOpen(true)
          navigate('/', { replace: true })
          return
        }
        navigate(parent, { replace: true })
      }, 30)
    }
    window.addEventListener('popstate', onPop, true)
    return () => window.removeEventListener('popstate', onPop, true)
  }, [navigate])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    const handle = App.addListener('backButton', () => {
      goBackRef.current()
    })
    return () => {
      void handle.then((listener) => listener.remove())
    }
  }, [])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    let gesture: { x: number; y: number; edge: 'left' | 'right' } | null = null
    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      const bounds = shell.getBoundingClientRect()
      if (touch.clientX - bounds.left <= EDGE_PX) gesture = { x: touch.clientX, y: touch.clientY, edge: 'left' }
      else if (bounds.right - touch.clientX <= EDGE_PX) gesture = { x: touch.clientX, y: touch.clientY, edge: 'right' }
      else gesture = null
    }
    const onMove = (event: TouchEvent) => {
      if (!gesture || event.touches.length !== 1) return
      const touch = event.touches[0]
      const dx = touch.clientX - gesture.x
      const inward = gesture.edge === 'left' ? dx > SWIPE_PX : dx < -SWIPE_PX
      if (inward && Math.abs(touch.clientY - gesture.y) < SWIPE_PX) event.preventDefault()
    }
    const onEnd = (event: TouchEvent) => {
      if (!gesture) return
      const touch = event.changedTouches[0]
      if (!touch) {
        gesture = null
        return
      }
      const dx = touch.clientX - gesture.x
      const inward = gesture.edge === 'left' ? dx >= SWIPE_PX : dx <= -SWIPE_PX
      const straight = Math.abs(touch.clientY - gesture.y) < SWIPE_PX
      gesture = null
      if (inward && straight) goBackRef.current()
    }
    shell.addEventListener('touchstart', onStart, { passive: true })
    shell.addEventListener('touchmove', onMove, { passive: false })
    shell.addEventListener('touchend', onEnd)
    return () => {
      shell.removeEventListener('touchstart', onStart)
      shell.removeEventListener('touchmove', onMove)
      shell.removeEventListener('touchend', onEnd)
    }
  }, [shellRef])

  if (!exitOpen) return null
  return (
    <div className="absolute inset-0 z-50 flex items-end bg-[#1a1613]/80 px-4 pb-8" role="dialog" aria-modal="true" aria-label="是否退出游戏">
      <div className="w-full rounded-2xl bg-[#f4efe6] px-4 py-4 text-[#241f1a]">
        <h2 className="text-base font-semibold">是否退出游戏</h2>
        {offerIdle ? <p className="mt-2 text-sm text-[#6d6256]">是否需要挂机</p> : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" className="text-sm font-semibold text-[#8d6844]" onClick={() => setExitOpen(false)}>
            取消
          </button>
          {offerIdle ? (
            <button
              type="button"
              className="text-sm font-semibold text-[#8d6844]"
              onClick={() => {
                startClearedIdle()
                leaveGame()
                setExitOpen(false)
              }}
            >
              挂机并退出
            </button>
          ) : null}
          <button
            type="button"
            className="text-sm font-semibold text-[#241f1a]"
            onClick={() => {
              leaveGame()
              setExitOpen(false)
            }}
          >
            退出
          </button>
        </div>
      </div>
    </div>
  )
}
