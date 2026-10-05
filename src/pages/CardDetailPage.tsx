import { useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getPlayerSnapshot, subscribePlayer, unequipDeckCard, useBagCard } from '../data/player'
import { UnitCard } from '../ui/UnitCard'

/**
 * 卡牌详情页。背包里可以上阵，卡组里可以下阵。升级之类的功能以后加在这一页。
 *
 * @returns 卡牌详情
 */
export default function CardDetailPage() {
  const { place, cardId } = useParams()
  const navigate = useNavigate()
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const fromDeck = place === 'deck'
  const bagItem = fromDeck ? undefined : player.bag.find((item) => item.id === cardId && item.kind === 'card')
  const card = fromDeck ? player.deck.find((entry) => entry.uid === cardId)?.card : bagItem?.kind === 'card' ? bagItem.card : undefined
  const backTo = fromDeck ? '/deck' : '/bag'
  const backLabel = fromDeck ? '返回卡组' : '返回背包'
  if (!card || (place !== 'deck' && place !== 'bag')) {
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
        <UnitCard card={card} />
      </div>
      {bagItem && bagItem.count > 1 ? <p className="mt-3 text-sm text-[#c8b49a]">数量 {bagItem.count}</p> : null}
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
        ) : (
          <button
            type="button"
            className="rounded-lg bg-[#f4efe6] px-3 py-2 text-sm font-semibold text-[#241f1a]"
            onClick={() => {
              if (!cardId || !useBagCard(cardId)) return
              navigate('/deck')
            }}
          >
            使用
          </button>
        )}
      </div>
    </div>
  )
}
