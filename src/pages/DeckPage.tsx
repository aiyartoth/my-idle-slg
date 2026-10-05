import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { sortDeckEntries, type DeckSortDir, type DeckSortKey } from '../data/deckSort'
import { getPlayerSnapshot, subscribePlayer } from '../data/player'
import { CardSortBar } from '../ui/CardSortBar'
import { UnitCard } from '../ui/UnitCard'

/**
 * 卡组页。点开一张牌进入详情，可以从那里下阵回背包。
 * 顶部分类固定，四个分类共用一对上下箭头，列表在下面滚动。
 *
 * @returns 卡组页
 */
export default function DeckPage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [key, setKey] = useState<DeckSortKey>('rarity')
  const [dir, setDir] = useState<DeckSortDir | null>(null)
  const deck = dir ? sortDeckEntries(player.deck, key, dir) : player.deck
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-4">
        <h1 className="sr-only">卡组管理</h1>
        <CardSortBar sortKey={key} dir={dir} ariaLabel="卡组排序" onChangeKey={setKey} onChangeDir={setDir} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3">
        {deck.length === 0 ? <p className="text-sm text-[#c8b49a]">卡组是空的。</p> : null}
        <ul className="flex flex-col gap-3">
          {deck.map((entry) => (
            <li key={entry.uid}>
              <Link to={`/card/deck/${entry.uid}`} className="block">
                <UnitCard card={entry.card} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
