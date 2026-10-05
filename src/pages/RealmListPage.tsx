import { useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { formatDuration } from '../data/idle'
import { getPlayerSnapshot, subscribePlayer, toggleRealmIdle } from '../data/player'
import { REALMS } from '../realm/yellowTurban'

/**
 * 秘境列表。通关过的秘境显示最快时间，并可以挂机。
 *
 * @returns 秘境列表页
 */
export default function RealmListPage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  return (
    <div className="px-4 py-4">
      <h1 className="text-lg font-semibold">秘境</h1>
      <ul className="mt-3 flex flex-col gap-3">
        {REALMS.map((realm) => {
          const progress = player.realms[realm.id]
          return (
            <li key={realm.id} className={realm.open ? 'rounded-xl bg-[#f4efe6] px-3 py-3 text-[#241f1a]' : 'rounded-xl bg-[#2a241f] px-3 py-3 text-[#a89886]'}>
              {realm.open ? (
                <Link to={`/realm/${realm.id}`} className="block">
                  <span className="text-base font-semibold">{realm.name}</span>
                  <span className="mt-1 block text-sm text-[#6d6256]">已开放 · {realm.detail}</span>
                  {progress ? <span className="mt-1 block text-sm text-[#8d6844]">最快通关 {formatDuration(progress.bestClearMs)}</span> : null}
                </Link>
              ) : (
                <>
                  <span className="text-base font-semibold">{realm.name}</span>
                  <span className="mt-1 block text-sm">未开放</span>
                </>
              )}
              {progress ? (
                <button type="button" className="mt-2 text-sm font-semibold text-[#8d6844]" onClick={() => toggleRealmIdle(realm.id)}>
                  {progress.idling ? '挂机中' : '挂机'}
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
