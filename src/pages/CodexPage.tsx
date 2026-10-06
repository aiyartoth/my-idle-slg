import { useEffect, useState, useSyncExternalStore } from 'react'
import { ALL_CARDS } from '../data/cardCatalog'
import { DEFAULT_SORT_DIR, sortDeckEntries, type DeckSortDir, type DeckSortKey } from '../data/deckSort'
import { getPlayerSnapshot, subscribePlayer } from '../data/player'
import type { UnitCardData } from '../data/cards'
import { readCardListBrief, writeCardListBrief } from '../ui/cardListBrief'
import { CardSortBar } from '../ui/CardSortBar'
import { UnitCard } from '../ui/UnitCard'

/**
 * 图鉴。列出已经设计的全部卡牌。已获得的保持原样，未获得的盖一层灰。
 * 顶部分类排序和卡组管理是同一条，箭头右侧的详略也一样。简略时一行两张，只留名字、类型和冷却。
 * 简略时点一张牌弹出详情浮层，关掉后回到列表。
 * 进来时稀有度升序已经生效。详略会记住，离开再回来仍是上次的样子。
 *
 * @returns 图鉴页
 */
export default function CodexPage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [key, setKey] = useState<DeckSortKey>('rarity')
  const [dir, setDir] = useState<DeckSortDir>(DEFAULT_SORT_DIR)
  const [brief, setBrief] = useState(() => readCardListBrief('codex'))
  const [openId, setOpenId] = useState<string | null>(null)
  const owned = ownedCardIds(player.deck, player.bag)
  const cards = sortDeckEntries(ALL_CARDS.map((card) => ({ card })), key, dir).map((entry) => entry.card)
  const openCard = cards.find((card) => card.id === openId)
  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-4">
        <h1 className="text-lg font-semibold">图鉴</h1>
        <div className="mt-3">
          <CardSortBar
            sortKey={key}
            dir={dir}
            brief={brief}
            ariaLabel="图鉴排序"
            onChangeKey={setKey}
            onChangeDir={setDir}
            onToggleBrief={() => {
              setBrief((value) => {
                const next = !value
                writeCardListBrief('codex', next)
                return next
              })
              setOpenId(null)
            }}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3">
        <ul className={brief ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-3'}>
          {cards.map((card) => {
            const obtained = owned.has(card.id)
            return (
              <li key={card.id} className="relative">
                {brief ? (
                  <button type="button" className="block w-full text-left" onClick={() => setOpenId(card.id)}>
                    <UnitCard card={card} brief />
                  </button>
                ) : (
                  <UnitCard card={card} />
                )}
                {obtained ? null : <div className="pointer-events-none absolute inset-0 rounded-xl bg-[#7a756c]/55" aria-hidden="true" />}
                {obtained ? null : <span className="sr-only">未获得</span>}
              </li>
            )
          })}
        </ul>
      </div>
      {brief && openCard ? <CodexDetail card={openCard} owned={owned.has(openCard.id)} onClose={() => setOpenId(null)} /> : null}
    </div>
  )
}

/**
 * 图鉴简略列表点开的详情。整张卡盖在列表上，点关闭或遮罩回到列表。
 *
 * @param props.card 点中的卡
 * @param props.owned 玩家是否已经获得
 * @param props.onClose 关掉浮层
 * @returns 详情浮层
 */
function CodexDetail({ card, owned, onClose }: { card: UnitCardData; owned: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="absolute inset-0 z-20 flex items-end bg-[#1a1613]/80" role="dialog" aria-modal="true" aria-label={`${card.name}详情`}>
      <button type="button" className="absolute inset-0" aria-label="关闭" onClick={onClose} />
      <div className="relative z-10 max-h-[80%] w-full overflow-y-auto px-4 pb-8">
        <div className="rounded-2xl bg-[#f4efe6] px-3 pt-2 pb-3 text-[#241f1a]">
          <div className="mb-2 flex justify-end">
            <button type="button" className="text-sm font-semibold text-[#6d6256]" onClick={onClose}>
              关闭
            </button>
          </div>
          <UnitCard card={card} />
          {owned ? null : <p className="mt-2 text-sm text-[#6d6256]">未获得</p>}
        </div>
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
