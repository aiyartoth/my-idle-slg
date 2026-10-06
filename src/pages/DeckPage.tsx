import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_SORT_DIR, sortDeckEntries, type DeckSortDir, type DeckSortKey } from '../data/deckSort'
import { getPlayerSnapshot, subscribePlayer, unequipDeckCard } from '../data/player'
import { readCardListBrief, writeCardListBrief } from '../ui/cardListBrief'
import { CardSortBar } from '../ui/CardSortBar'
import { UnitCard } from '../ui/UnitCard'

/**
 * 卡组页。列表上可以直接下阵回背包，点开一张牌仍进入详情。简略时下阵在类型行右侧。
 * 顶部分类固定，四个分类共用一对上下箭头，箭头右侧可以换成简略。列表在下面滚动。
 * 进来时稀有度升序已经生效。详略会记住，从详情返回仍是上次的样子。
 *
 * @returns 卡组页
 */
export default function DeckPage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [key, setKey] = useState<DeckSortKey>('rarity')
  const [dir, setDir] = useState<DeckSortDir>(DEFAULT_SORT_DIR)
  const [brief, setBrief] = useState(() => readCardListBrief('deck'))
  const deck = sortDeckEntries(player.deck, key, dir)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-4">
        <h1 className="sr-only">卡组管理</h1>
        <CardSortBar
          sortKey={key}
          dir={dir}
          brief={brief}
          ariaLabel="卡组排序"
          onChangeKey={setKey}
          onChangeDir={setDir}
          onToggleBrief={() => {
            setBrief((value) => {
              const next = !value
              writeCardListBrief('deck', next)
              return next
            })
          }}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3">
        {deck.length === 0 ? <p className="text-sm text-[#c8b49a]">卡组是空的。</p> : null}
        <ul className={brief ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-3'}>
          {deck.map((entry) => (
            <li key={entry.uid} className="relative h-full">
              <Link to={`/card/deck/${entry.uid}`} className="absolute inset-0 z-0 rounded-xl" aria-label={entry.card.name} />
              <div className="pointer-events-none relative z-10 h-full">
                <UnitCard card={entry.card} brief={brief} onUnequip={() => unequipDeckCard(entry.uid)} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
