import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import type { UnitCardData } from '../data/cards'
import { formatDuration } from '../data/idle'
import { getPlayerSnapshot, subscribePlayer, toggleRealmIdle } from '../data/player'
import { STORMWIND_LEGEND_CARDS, STORMWIND_NORMAL_CARDS } from '../realm/stormwind'
import { REALMS, YELLOW_TURBAN_ENEMY_DECK, type RealmInfo } from '../realm/yellowTurban'
import { UnitCard } from '../ui/UnitCard'

/**
 * 秘境列表。通关过的秘境显示最快时间，并可以挂机。
 * 名字右侧可以看敌人阵容，名字下面是秘境描述。
 *
 * @returns 秘境列表页
 */
export default function RealmListPage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [lineupId, setLineupId] = useState<string | null>(null)
  const lineup = REALMS.find((realm) => realm.id === lineupId) ?? null
  return (
    <div className="px-4 py-4">
      <h1 className="text-lg font-semibold">秘境</h1>
      <ul className="mt-3 flex flex-col gap-3">
        {REALMS.map((realm) => {
          const progress = player.realms[realm.id]
          return (
            <li key={realm.id} className={realm.open ? 'rounded-xl bg-[#f4efe6] px-3 py-3 text-[#241f1a]' : 'rounded-xl bg-[#2a241f] px-3 py-3 text-[#a89886]'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {realm.open ? (
                    <Link to={`/realm/${realm.id}`} className="block">
                      <span className="text-base font-semibold">{realm.name}</span>
                      <span className="mt-1 block text-sm text-[#6d6256]">{realm.description}</span>
                      {progress ? <span className="mt-1 block text-sm text-[#8d6844]">最快通关 {formatDuration(progress.bestClearMs)}</span> : null}
                    </Link>
                  ) : (
                    <>
                      <span className="text-base font-semibold">{realm.name}</span>
                      <span className="mt-1 block text-sm">未开放</span>
                    </>
                  )}
                </div>
                <button type="button" className="shrink-0 text-sm font-semibold text-[#8d6844]" onClick={() => setLineupId(realm.id)}>
                  敌人阵容
                </button>
              </div>
              {progress ? (
                <button type="button" className="mt-2 text-sm font-semibold text-[#8d6844]" onClick={() => toggleRealmIdle(realm.id)}>
                  {progress.idling ? '挂机中' : '挂机'}
                </button>
              ) : null}
            </li>
          )
        })}
      </ul>
      {lineup ? <EnemyLineup realm={lineup} cards={enemyCards(lineup.id)} onClose={() => setLineupId(null)} /> : null}
    </div>
  )
}

/**
 * 这个秘境会出现的敌方卡。同名只留一张，按出场表的顺序排。
 *
 * @param realmId 秘境 id
 * @returns 可能出场的单位。还没配阵容时是空的
 */
function enemyCards(realmId: string): readonly UnitCardData[] {
  if (realmId === 'yellow-turban') return uniqueCards(YELLOW_TURBAN_ENEMY_DECK)
  if (realmId === 'stormwind') return [...STORMWIND_NORMAL_CARDS, ...STORMWIND_LEGEND_CARDS]
  return []
}

/**
 * 按卡牌 id 去掉重复。黄巾牌库里步兵会放两张，阵容只展示种类。
 *
 * @param cards 可能带重复的牌库
 * @returns 每种一张
 */
function uniqueCards(cards: readonly UnitCardData[]): UnitCardData[] {
  const seen = new Set<string>()
  return cards.filter((card) => {
    if (seen.has(card.id)) return false
    seen.add(card.id)
    return true
  })
}

/**
 * 敌人阵容浮层。列出这个秘境会出现的卡，点遮罩或关闭回到列表。
 *
 * @param props.realm 当前秘境
 * @param props.cards 会出现的单位
 * @param props.onClose 关掉浮层
 * @returns 阵容浮层
 */
function EnemyLineup({ realm, cards, onClose }: { realm: RealmInfo; cards: readonly UnitCardData[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" role="dialog" aria-modal="true" aria-label={`${realm.name}敌人阵容`}>
      <button type="button" className="absolute inset-0" aria-label="关闭" onClick={onClose} />
      <div className="relative z-10 flex max-h-[80%] w-full max-w-md flex-col rounded-t-2xl bg-[#1a1613] px-4 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[#f4efe6]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">敌人阵容</h2>
          <button type="button" className="text-sm text-[#c8b49a]" onClick={onClose}>
            关闭
          </button>
        </div>
        <p className="mt-1 text-sm text-[#c8b49a]">{realm.name}会出现的卡牌</p>
        <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
          {cards.map((card) => (
            <li key={card.id}>
              <UnitCard card={card} brief />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
