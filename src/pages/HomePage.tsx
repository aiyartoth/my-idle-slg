import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { NAV_ITEMS } from '../data/nav'
import { formatActivityLine, getPlayerSnapshot, HP_PER_LEVEL, subscribePlayer } from '../data/player'
import { getSession, realmEntryPath, subscribeSession } from '../realm/battleSession'

/**
 * 首页。等级和经验条放在一起，入口排成两列。底部是通关和战斗结果。
 *
 * @returns 首页
 */
export default function HomePage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const session = useSyncExternalStore(subscribeSession, getSession)
  const realmTo = realmEntryPath(session)
  const fighting = session.status === 'running'
  const idling = Object.values(player.realms).some((realm) => realm.idling)
  const expRatio = Math.min(100, (player.exp / player.expToNext) * 100)
  return (
    <div className="flex min-h-full flex-col px-4 py-4">
      <h1 className="text-lg font-semibold">冒险者</h1>
      <section className="mt-3 rounded-xl bg-[#2a241f] px-3 py-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base font-semibold">等级 {player.level}</h2>
          <p className="text-sm tabular-nums text-[#c8b49a]">
            经验 {player.exp} / {player.expToNext}
          </p>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1a1613]" role="progressbar" aria-valuemin={0} aria-valuenow={player.exp} aria-valuemax={player.expToNext} aria-label={`经验 ${player.exp} / ${player.expToNext}`}>
          <div className="h-full rounded-full bg-[#e6c36a]" style={{ width: `${expRatio}%` }} />
        </div>
      </section>
      <section className="mt-3 rounded-xl bg-[#2a241f] px-3 py-3">
        <h2 className="text-xs text-[#c8b49a]">大本营生命</h2>
        <p className="mt-1 text-xl font-semibold tabular-nums">{player.baseHp}</p>
        <p className="mt-2 text-sm leading-5 text-[#c8b49a]">
          由等级、科技、神器决定。目前每级增加 {HP_PER_LEVEL} 点，科技暂无，神器暂无。
        </p>
      </section>
      <nav className="mt-4 grid grid-cols-2 gap-2" aria-label="功能">
        {NAV_ITEMS.map((item) => (
          <Link key={item.label} to={item.label === '秘境' ? realmTo : item.to} className="flex min-h-16 flex-col justify-center rounded-xl bg-[#f4efe6] px-3 py-3 text-[#241f1a]">
            <span className="text-base font-semibold">{item.label}</span>
            {item.label === '秘境' && fighting ? <span className="mt-1 text-xs text-[#8d6844]">战斗中</span> : null}
            {item.label === '秘境' && idling ? <span className="mt-1 text-xs text-[#8d6844]">挂机中</span> : null}
          </Link>
        ))}
        <Link to="/codex" className="flex min-h-16 flex-col justify-center rounded-xl bg-[#f4efe6] px-3 py-3 text-[#241f1a]">
          <span className="text-base font-semibold">图鉴</span>
        </Link>
        <Link to="/gm" className="flex min-h-16 flex-col justify-center rounded-xl bg-[#f4efe6] px-3 py-3 text-[#241f1a]">
          <span className="text-base font-semibold">GM</span>
        </Link>
      </nav>
      <ActivityLog entries={player.activityLog} />
    </div>
  )
}

/**
 * 首页底部的战斗记录。新的一条在最上面。
 *
 * @param props.entries 已经按新到旧排好的日志
 * @returns 日志模块
 */
function ActivityLog({ entries }: { entries: readonly { at: number; text: string }[] }) {
  return (
    <section className="mt-auto pt-4" aria-label="日志">
      <div className="rounded-xl bg-[#2a241f] px-3 py-3">
        <h2 className="text-xs text-[#c8b49a]">日志</h2>
        {entries.length === 0 ? (
          <p className="mt-2 text-sm text-[#8d6844]">还没有战斗记录</p>
        ) : (
          <ol className="mt-2 max-h-52 space-y-2 overflow-y-auto">
            {entries.map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="text-sm leading-5 break-words text-[#f4efe6]">
                {formatActivityLine(entry)}
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
