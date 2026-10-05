import { useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { RARITY_TEXT_CLASS } from '../data/cards'
import { bagItemLabel, getPlayerSnapshot, subscribePlayer, type BagCard } from '../data/player'

/** 背包分类。材料和卡牌分开看 */
type BagTab = 'material' | 'card'

/** 分类页签。材料在前，卡牌在后 */
const BAG_TABS: readonly { id: BagTab; label: string }[] = [
  { id: 'material', label: '材料' },
  { id: 'card', label: '卡牌' },
]

/**
 * 背包。标题和分类钉在顶部，下面的列表自己滚动。卡牌名字用稀有度颜色。
 *
 * @returns 背包页
 */
export default function BagPage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [tab, setTab] = useState<BagTab>('card')
  const items = player.bag.filter((item) => item.kind === tab)
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-4">
        <h1 className="text-lg font-semibold">背包</h1>
        <div className="mt-3 flex gap-4 border-b border-[#3a322b]" role="tablist" aria-label="背包分类">
          {BAG_TABS.map((item) => {
            const selected = item.id === tab
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`border-b-2 pb-2 text-sm font-semibold ${selected ? 'border-[#e6c36a] text-[#e6c36a]' : 'border-transparent text-[#c8b49a]'}`}
                onClick={() => setTab(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3">
        {items.length === 0 ? <p className="text-sm text-[#c8b49a]">{tab === 'card' ? '没有卡牌。' : '没有材料。'}</p> : null}
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id}>
              {item.kind === 'card' ? (
                <Link to={`/card/bag/${item.id}`} className="block rounded-xl bg-[#f4efe6] px-3 py-3 text-base font-semibold text-[#241f1a]">
                  <BagCardName item={item} />
                </Link>
              ) : (
                <div className="rounded-xl bg-[#f4efe6] px-3 py-3 text-base font-semibold text-[#241f1a]">{bagItemLabel(item)}</div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * 背包里的卡牌名字。前缀和数量保持深色，名字按稀有度上色。
 *
 * @param props.item 一叠卡牌
 * @returns 带颜色的名字
 */
function BagCardName({ item }: { item: BagCard }) {
  return (
    <span>
      卡牌: <span className={RARITY_TEXT_CLASS[item.card.rarity]}>{item.card.name}</span>
      {item.count > 1 ? ` ×${item.count}` : ''}
    </span>
  )
}
