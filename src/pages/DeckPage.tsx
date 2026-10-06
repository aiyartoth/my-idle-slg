import { useEffect, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { DEFAULT_SORT_DIR, filterByRaceGroup, groupByRace, raceGroupsIn, sortDeckEntries, type DeckSortDir, type DeckSortKey } from '../data/deckSort'
import { DECK_LIMIT, getPlayerSnapshot, releaseExtraLegends, subscribePlayer, unequipDeckCard } from '../data/player'
import { readCardListBrief, writeCardListBrief } from '../ui/cardListBrief'
import { CardSortBar, RaceGroupHeading } from '../ui/CardSortBar'
import { UnitCard } from '../ui/UnitCard'

/**
 * 卡组页。列表上可以直接下阵回背包，点开一张牌仍进入详情。简略时下阵在类型行右侧。
 * 顶部分类固定，四个分类共用一对上下箭头，箭头右侧可以换成简略。列表在下面滚动。
 * 进来时稀有度升序已经生效。详略会记住，从详情返回仍是上次的样子。
 * 选定某一个种族时，箭头改成按稀有度升降。
 * 进来时把多出来的同名传奇放回背包。箭头左边是当前张数和上限。
 *
 * @returns 卡组页
 */
export default function DeckPage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [key, setKey] = useState<DeckSortKey>('rarity')
  const [dir, setDir] = useState<DeckSortDir>(DEFAULT_SORT_DIR)
  const [raceGroup, setRaceGroup] = useState<string | null>(null)
  const [brief, setBrief] = useState(() => readCardListBrief('deck'))
  useEffect(() => {
    releaseExtraLegends()
  }, [])
  const raceGroups = raceGroupsIn(player.deck.map((entry) => entry.card))
  const activeRace = key === 'race' && raceGroup && raceGroups.includes(raceGroup) ? raceGroup : null
  const sorted = sortDeckEntries(activeRace ? filterByRaceGroup(player.deck, activeRace) : player.deck, activeRace ? 'rarity' : key, dir)
  const deck = sorted
  const raceSections = key === 'race' && activeRace === null ? groupByRace(sorted) : null
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-4">
        <h1 className="sr-only">卡组管理</h1>
        <CardSortBar
          sortKey={key}
          dir={dir}
          brief={brief}
          ariaLabel="卡组排序"
          raceGroups={raceGroups}
          raceGroup={activeRace}
          onChangeKey={setKey}
          onChangeDir={setDir}
          onChangeRaceGroup={setRaceGroup}
          deckCount={{ current: player.deck.length, limit: DECK_LIMIT }}
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
        {player.deck.length === 0 ? <p className="text-sm text-[#c8b49a]">卡组是空的。</p> : null}
        {player.deck.length > 0 && deck.length === 0 ? <p className="text-sm text-[#c8b49a]">这个种族还没有牌。</p> : null}
        <ul className={brief ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-3'}>
          {(raceSections ?? [{ group: '', entries: deck }]).flatMap((section) => {
            const heading = raceSections ? (
              <li key={`race-${section.group}`} className="col-span-2">
                <RaceGroupHeading name={section.group} />
              </li>
            ) : null
            const items = section.entries.map((entry) => (
              <li key={entry.uid} className="relative h-full">
                <Link to={`/card/deck/${entry.uid}`} className="absolute inset-0 z-0 rounded-xl" aria-label={entry.card.name} />
                <div className="pointer-events-none relative z-10 h-full">
                  <UnitCard card={entry.card} brief={brief} onUnequip={() => unequipDeckCard(entry.uid)} />
                </div>
              </li>
            ))
            return heading ? [heading, ...items] : items
          })}
        </ul>
      </div>
    </div>
  )
}
