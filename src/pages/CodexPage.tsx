import { useState, useSyncExternalStore } from 'react'
import { ALL_CARDS } from '../data/cardCatalog'
import { sortDeckEntries, type DeckSortDir, type DeckSortKey } from '../data/deckSort'
import { getPlayerSnapshot, subscribePlayer } from '../data/player'
import { CardSortBar } from '../ui/CardSortBar'
import { UnitCard } from '../ui/UnitCard'

/**
 * 图鉴。列出已经设计的全部卡牌。已获得的保持原样，未获得的盖一层灰。
 * 顶部分类排序和卡组管理是同一条。
 *
 * @returns 图鉴页
 */
export default function CodexPage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [key, setKey] = useState<DeckSortKey>('rarity')
  const [dir, setDir] = useState<DeckSortDir | null>(null)
  const owned = ownedCardIds(player.deck, player.bag)
  const cards = dir ? sortDeckEntries(ALL_CARDS.map((card) => ({ card })), key, dir).map((entry) => entry.card) : ALL_CARDS
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-4">
        <h1 className="text-lg font-semibold">图鉴</h1>
        <div className="mt-3">
          <CardSortBar sortKey={key} dir={dir} ariaLabel="图鉴排序" onChangeKey={setKey} onChangeDir={setDir} />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3">
        <ul className="flex flex-col gap-3">
          {cards.map((card) => {
            const obtained = owned.has(card.id)
            return (
              <li key={card.id} className="relative">
                <UnitCard card={card} />
                {obtained ? null : <div className="pointer-events-none absolute inset-0 rounded-xl bg-[#7a756c]/55" aria-hidden="true" />}
                {obtained ? null : <span className="sr-only">未获得</span>}
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

/**
 * 收集玩家现在拿着的卡牌 id。背包和卡组都算已经获得。
 *
 * @param deck 当前卡组
 * @param bag 当前背包
 * @returns 已经获得的卡牌 id
 */
function ownedCardIds(deck: readonly { card: { id: string } }[], bag: readonly { kind: string; card?: { id: string } }[]): Set<string> {
  const ids = new Set<string>()
  deck.forEach((entry) => ids.add(entry.card.id))
  bag.forEach((item) => {
    if (item.kind === 'card' && item.card) ids.add(item.card.id)
  })
  return ids
}
