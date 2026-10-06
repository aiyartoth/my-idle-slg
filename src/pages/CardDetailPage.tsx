import { useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { RARITY_TEXT_CLASS, type UnitCardData } from '../data/cards'
import { DECK_FULL_MESSAGE, DECK_LEGEND_MESSAGE, getPlayerSnapshot, subscribePlayer, unequipDeckCard, useBagCard } from '../data/player'
import { DeckLimitNotices } from '../ui/DeckLimitNotices'
import { UnitCard } from '../ui/UnitCard'

/**
 * 卡牌详情页。背包里可以上阵，卡组里可以下阵。升级之类的功能以后加在这一页。
 * 背包里用掉一张后留在本页，还有同名牌就继续显示使用。
 * 卡组已满或同名传奇已在卡组时，背包里的牌不动。
 * 数量始终显示，包括只剩 1 张，以及用完后留在本页的 0。
 *
 * @returns 卡牌详情
 */
export default function CardDetailPage() {
  const { place, cardId } = useParams()
  const navigate = useNavigate()
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [joined, setJoined] = useState<UnitCardData | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [joinedFor, setJoinedFor] = useState('')
  const seenRef = useRef<{ id: string; card: UnitCardData } | null>(null)
  const fromDeck = place === 'deck'
  const bagItem = fromDeck ? undefined : player.bag.find((item) => item.id === cardId && item.kind === 'card')
  const card = fromDeck ? player.deck.find((entry) => entry.uid === cardId)?.card : bagItem?.kind === 'card' ? bagItem.card : undefined
  const routeId = `${place ?? ''}:${cardId ?? ''}`
  if (joinedFor !== routeId) {
    setJoinedFor(routeId)
    setJoined(null)
    setNotice(null)
  }
  if (card && seenRef.current?.id !== routeId) seenRef.current = { id: routeId, card }
  if (!card && seenRef.current && seenRef.current.id !== routeId) seenRef.current = null
  const shown = card ?? (seenRef.current?.id === routeId ? seenRef.current.card : undefined)
  const canUse = !fromDeck && !!bagItem && bagItem.count > 0
  const backTo = fromDeck ? '/deck' : '/bag'
  const backLabel = fromDeck ? '返回卡组' : '返回背包'
  if (!shown || (place !== 'deck' && place !== 'bag')) {
    return (
      <div className="px-4 py-4">
        <p>这张牌已经不在了。</p>
        <Link to="/bag" className="mt-3 inline-block text-sm text-[#c8b49a]">
          返回背包
        </Link>
      </div>
    )
  }
  return (
    <div className="px-4 py-4">
      <Link to={backTo} className="text-sm text-[#c8b49a]">
        {backLabel}
      </Link>
      <h1 className="mt-3 text-lg font-semibold">卡牌详情</h1>
      <div className="mt-3">
        <UnitCard card={shown} />
      </div>
      {!fromDeck ? <p className="mt-3 text-sm text-[#c8b49a]">数量 {bagItem?.kind === 'card' ? bagItem.count : 0}</p> : null}
      {joined ? <JoinedNotice card={joined} /> : null}
      {notice ? (
        <div className="mt-3">
          <DeckLimitNotices messages={[notice]} />
        </div>
      ) : null}
      <div className="mt-4">
        {fromDeck ? (
          <button
            type="button"
            className="rounded-lg bg-[#f4efe6] px-3 py-2 text-sm font-semibold text-[#241f1a]"
            onClick={() => {
              if (!cardId || !unequipDeckCard(cardId)) return
              navigate('/bag')
            }}
          >
            下阵
          </button>
        ) : canUse ? (
          <button
            type="button"
            className="rounded-lg bg-[#f4efe6] px-3 py-2 text-sm font-semibold text-[#241f1a]"
            onClick={() => {
              if (!cardId || !shown) return
              const used = useBagCard(cardId)
              if (used === 'legend') {
                setNotice(DECK_LEGEND_MESSAGE)
                return
              }
              if (used === 'full') {
                setNotice(DECK_FULL_MESSAGE)
                setJoined(null)
                return
              }
              if (used !== 'added') return
              setNotice(null)
              setJoined(shown)
            }}
          >
            使用
          </button>
        ) : null}
      </div>
    </div>
  )
}

/**
 * 上阵成功的提示。名字按稀有度上色，括号留着深色。
 *
 * @param props.card 刚放进卡组的那张牌
 * @returns 提示
 */
function JoinedNotice({ card }: { card: UnitCardData }) {
  return (
    <p className="mt-3 rounded-lg bg-[#f4efe6] px-3 py-2 text-sm font-semibold text-[#241f1a]" role="status">
      卡组中加入 [<span className={RARITY_TEXT_CLASS[card.rarity]}>{card.name}</span>]
    </p>
  )
}
