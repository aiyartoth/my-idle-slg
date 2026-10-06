import { useEffect, useState, useSyncExternalStore } from 'react'
import { findCardById } from '../data/cardCatalog'
import { RARITY_TEXT_CLASS } from '../data/cards'
import { crystalForCard, findFurnaceRecipe, FURNACE_MATERIAL_NAME, FURNACE_REFRESH_CRYSTAL, type FurnaceRecipe } from '../data/furnace'
import { craftFurnaceRecipe, decomposeBagCard, ensureFurnaceOffers, getPlayerSnapshot, refreshFurnaceOffers, subscribePlayer, type BagItem } from '../data/player'

/** 熔炉页签。分解在前，合成在后 */
type FurnaceTab = 'break' | 'craft'

/** 分类页签 */
const FURNACE_TABS: readonly { id: FurnaceTab; label: string }[] = [
  { id: 'break', label: '分解' },
  { id: 'craft', label: '合成' },
]

/**
 * 熔炉。分解背包里的卡换水晶，再用卡牌、材料和水晶按当前四条配方合成。
 *
 * @returns 熔炉页
 */
export default function FurnacePage() {
  const player = useSyncExternalStore(subscribePlayer, getPlayerSnapshot)
  const [tab, setTab] = useState<FurnaceTab>('break')
  const [notice, setNotice] = useState('')
  useEffect(() => {
    ensureFurnaceOffers()
  }, [])
  const cards = player.bag.filter((item): item is Extract<BagItem, { kind: 'card' }> => item.kind === 'card')
  const recipes = player.furnaceOffers.flatMap((id) => {
    const recipe = findFurnaceRecipe(id)
    return recipe ? [recipe] : []
  })
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 px-4 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-lg font-semibold">熔炉</h1>
          <p className="text-sm tabular-nums text-[#c8b49a]">水晶 {player.crystal}</p>
        </div>
        <div className="mt-3 flex gap-4 border-b border-[#3a322b]" role="tablist" aria-label="熔炉">
          {FURNACE_TABS.map((item) => {
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
        {notice ? (
          <p className="mb-3 text-sm text-[#e6c36a]" role="status">
            {notice}
          </p>
        ) : null}
        {tab === 'break' ? (
          <BreakList
            cards={cards}
            onBreak={(itemId) => {
              const gained = decomposeBagCard(itemId)
              if (gained > 0) setNotice(`分解获得 ${gained} 水晶`)
            }}
          />
        ) : (
          <CraftList
            recipes={recipes}
            bag={player.bag}
            crystal={player.crystal}
            onCraft={(recipeId) => {
              const card = craftFurnaceRecipe(recipeId)
              if (card) setNotice(`合成获得 ${card.name}`)
            }}
            onRefresh={() => {
              if (refreshFurnaceOffers()) setNotice('已刷新配方')
            }}
          />
        )}
      </div>
    </div>
  )
}

/**
 * 可分解的背包卡。一次拆一张。
 *
 * @param props.cards 背包里的卡牌
 * @param props.onBreak 分解这一叠里的一张
 * @returns 分解列表
 */
function BreakList({ cards, onBreak }: { cards: readonly Extract<BagItem, { kind: 'card' }>[]; onBreak: (itemId: string) => void }) {
  if (cards.length === 0) return <p className="text-sm text-[#c8b49a]">没有可分解的卡牌。</p>
  return (
    <ul className="flex flex-col gap-2">
      {cards.map((item) => (
        <li key={item.id} className="flex items-center gap-3 rounded-xl bg-[#f4efe6] px-3 py-3">
          <p className="min-w-0 flex-1 text-base font-semibold text-[#241f1a]">
            <span className={RARITY_TEXT_CLASS[item.card.rarity]}>{item.card.name}</span>
            <span className="text-[#241f1a]"> ×{item.count}</span>
          </p>
          <button type="button" className="shrink-0 rounded-lg bg-[#241f1a] px-3 py-2 text-sm font-semibold text-[#e6c36a]" onClick={() => onBreak(item.id)}>
            分解 +{crystalForCard(item.card)}
          </button>
        </li>
      ))}
    </ul>
  )
}

/**
 * 当前四条配方，以及花水晶刷新。
 *
 * @param props.recipes 正在展示的配方
 * @param props.bag 背包，用来对照还缺多少
 * @param props.crystal 现有水晶
 * @param props.onCraft 合成这一条
 * @param props.onRefresh 花水晶换一批
 * @returns 合成列表
 */
function CraftList({
  recipes,
  bag,
  crystal,
  onCraft,
  onRefresh,
}: {
  recipes: readonly FurnaceRecipe[]
  bag: readonly BagItem[]
  crystal: number
  onCraft: (recipeId: string) => void
  onRefresh: () => void
}) {
  const canRefresh = crystal >= FURNACE_REFRESH_CRYSTAL
  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {recipes.map((recipe) => (
          <RecipeRow key={recipe.id} recipe={recipe} bag={bag} crystal={crystal} onCraft={onCraft} />
        ))}
      </ul>
      <button
        type="button"
        className="rounded-lg bg-[#f4efe6] px-3 py-2 text-sm font-semibold text-[#241f1a] disabled:opacity-40"
        disabled={!canRefresh}
        onClick={onRefresh}
      >
        刷新（{FURNACE_REFRESH_CRYSTAL} 水晶）
      </button>
    </div>
  )
}

/**
 * 一条配方。材料不够时合成按钮不可点。
 *
 * @param props.recipe 配方
 * @param props.bag 背包
 * @param props.crystal 现有水晶
 * @param props.onCraft 合成
 * @returns 配方
 */
function RecipeRow({ recipe, bag, crystal, onCraft }: { recipe: FurnaceRecipe; bag: readonly BagItem[]; crystal: number; onCraft: (recipeId: string) => void }) {
  const result = findCardById(recipe.resultId)
  const ready = canCraft(recipe, bag, crystal)
  return (
    <li className="rounded-xl bg-[#f4efe6] px-3 py-3 text-[#241f1a]">
      <p className="text-sm leading-6">
        <RecipeCosts recipe={recipe} bag={bag} crystal={crystal} />
      </p>
      <p className="mt-1 text-sm font-semibold">
        获得 {result ? <span className={RARITY_TEXT_CLASS[result.rarity]}>{result.name}</span> : recipe.resultId}
      </p>
      <button
        type="button"
        className="mt-2 rounded-lg bg-[#241f1a] px-3 py-2 text-sm font-semibold text-[#e6c36a] disabled:opacity-40"
        disabled={!ready}
        onClick={() => onCraft(recipe.id)}
      >
        合成
      </button>
    </li>
  )
}

/**
 * 配方消耗。括号里是背包或水晶里现有的数量。
 *
 * @param props.recipe 配方
 * @param props.bag 背包
 * @param props.crystal 现有水晶
 * @returns 消耗文案
 */
function RecipeCosts({ recipe, bag, crystal }: { recipe: FurnaceRecipe; bag: readonly BagItem[]; crystal: number }) {
  const parts: { key: string; label: string; need: number; owned: number }[] = []
  recipe.cards.forEach((cost) => {
    parts.push({ key: cost.cardId, label: cardName(cost.cardId), need: cost.count, owned: ownedCards(bag, cost.cardId) })
  })
  recipe.materials.forEach((cost) => {
    parts.push({ key: cost.materialId, label: FURNACE_MATERIAL_NAME[cost.materialId] ?? cost.materialId, need: cost.count, owned: ownedMaterial(bag, cost.materialId) })
  })
  if (recipe.crystal > 0) parts.push({ key: 'crystal', label: '水晶', need: recipe.crystal, owned: crystal })
  return parts.map((part, index) => (
    <span key={part.key}>
      {index > 0 ? ' + ' : ''}
      {part.label} ×{part.need}
      <span className={part.owned >= part.need ? 'text-[#6d6256]' : 'text-[#a33b24]'}>（{part.owned}）</span>
    </span>
  ))
}

/**
 * 材料、卡牌和水晶是否都够合成这一条。
 *
 * @param recipe 配方
 * @param bag 背包
 * @param crystal 现有水晶
 * @returns 够的时候为 true
 */
function canCraft(recipe: FurnaceRecipe, bag: readonly BagItem[], crystal: number): boolean {
  if (crystal < recipe.crystal) return false
  const cardsReady = recipe.cards.every((cost) => ownedCards(bag, cost.cardId) >= cost.count)
  const materialsReady = recipe.materials.every((cost) => ownedMaterial(bag, cost.materialId) >= cost.count)
  return cardsReady && materialsReady
}

/**
 * 背包里某种卡有几张。
 *
 * @param bag 背包
 * @param cardId 卡牌 id
 * @returns 张数
 */
function ownedCards(bag: readonly BagItem[], cardId: string): number {
  const row = bag.find((item) => item.kind === 'card' && item.card.id === cardId)
  return row?.kind === 'card' ? row.count : 0
}

/**
 * 背包里某种材料有几个。
 *
 * @param bag 背包
 * @param materialId 材料 id
 * @returns 个数
 */
function ownedMaterial(bag: readonly BagItem[], materialId: string): number {
  const row = bag.find((item) => item.kind === 'material' && item.materialId === materialId)
  return row?.kind === 'material' ? row.count : 0
}

/**
 * 配方上卡牌 id 对应的名字。
 *
 * @param cardId 卡牌 id
 * @returns 卡牌名字。图鉴里没有时退回 id
 */
function cardName(cardId: string): string {
  return findCardById(cardId)?.name ?? cardId
}
