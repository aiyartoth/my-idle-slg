import { useEffect, useState, useSyncExternalStore } from 'react'
import { formatDuration, IDLE_CAP_MS } from '../data/idle'
import { dismissSettlement, getSettlement, subscribeSettlement } from '../data/player'

/** 结算进度条走完的时间 */
const SETTLEMENT_MS = 1600

/**
 * 离线超过 10 分钟后的结算浮层。进度走完才列出战利品。
 *
 * @returns 浮层；没有待结算时不显示
 */
export function OfflineSettlement() {
  const report = useSyncExternalStore(subscribeSettlement, getSettlement)
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (!report) return
    setProgress(0)
    const started = performance.now()
    let frame = 0
    const step = (now: number) => {
      const ratio = Math.min(1, (now - started) / SETTLEMENT_MS)
      setProgress(ratio)
      if (ratio < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [report])
  if (!report) return null
  const done = progress >= 1
  const gold = Math.round(report.gold * progress)
  const exp = Math.round(report.exp * progress)
  return (
    <div className="absolute inset-0 z-40 flex items-end bg-[#1a1613]/80 px-4 pb-8" role="dialog" aria-label="离线结算">
      <div className="w-full rounded-2xl bg-[#f4efe6] px-4 py-4 text-[#241f1a]">
        <h2 className="text-base font-semibold">离线结算</h2>
        <p className="mt-1 text-sm text-[#6d6256]">
          离线 {formatDuration(report.settledMs)} · 上限 {formatDuration(IDLE_CAP_MS)}
        </p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e4d8c8]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)} aria-label="结算进度">
          <div className="h-full rounded-full bg-[#8d6844]" style={{ width: `${progress * 100}%` }} />
        </div>
        <ul className="mt-3 flex flex-col gap-1 text-sm">
          <li>经验 +{exp}</li>
          <li>金币 +{gold}</li>
          {report.cards.map((card) => (
            <li key={card.card.id}>
              卡牌: {card.name} ×{done ? card.count : Math.round(card.count * progress)}
            </li>
          ))}
          {report.materials.map((material) => (
            <li key={material.id}>
              材料: {material.name} ×{done ? material.count : Math.round(material.count * progress)}
            </li>
          ))}
        </ul>
        <button type="button" className="mt-4 text-sm font-semibold text-[#8d6844] disabled:text-[#b7a898]" disabled={!done} onClick={dismissSettlement}>
          确认
        </button>
      </div>
    </div>
  )
}
