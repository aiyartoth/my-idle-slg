import type { DeckSortDir, DeckSortKey } from '../data/deckSort'

/** 卡组和卡牌图鉴共用的排序项 */
const SORT_TABS: readonly { key: DeckSortKey; label: string }[] = [
  { key: 'rarity', label: '稀有度' },
  { key: 'race', label: '种族' },
  { key: 'profession', label: '职业' },
  { key: 'cd', label: 'CD' },
]

/**
 * 分类排序条。四个分类共用一对上下箭头，点箭头才改变顺序。
 * 箭头右侧是详略切换，简略时列表一行放两张牌。
 *
 * @param props.sortKey 当前分类
 * @param props.dir 当前方向。还没点箭头时为空
 * @param props.brief 当前是不是简略展示
 * @param props.ariaLabel 这条工具栏的名字
 * @param props.onChangeKey 换分类
 * @param props.onChangeDir 换升降序
 * @param props.onToggleBrief 在详细和简略之间切换
 * @returns 固定在页面顶部的排序条
 */
export function CardSortBar({
  sortKey,
  dir,
  brief,
  ariaLabel,
  onChangeKey,
  onChangeDir,
  onToggleBrief,
}: {
  sortKey: DeckSortKey
  dir: DeckSortDir | null
  brief: boolean
  ariaLabel: string
  onChangeKey: (key: DeckSortKey) => void
  onChangeDir: (dir: DeckSortDir) => void
  onToggleBrief: () => void
}) {
  const label = SORT_TABS.find((tab) => tab.key === sortKey)?.label ?? '稀有度'
  return (
    <div className="flex items-center gap-3 border-b border-[#3a322b]" role="toolbar" aria-label={ariaLabel}>
      <div className="flex min-w-0 flex-1 gap-4" role="tablist" aria-label="排序分类">
        {SORT_TABS.map((tab) => {
          const selected = tab.key === sortKey
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`border-b-2 pb-2 text-sm font-semibold ${selected ? 'border-[#e6c36a] text-[#e6c36a]' : 'border-transparent text-[#c8b49a]'}`}
              onClick={() => onChangeKey(tab.key)}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <div className="flex shrink-0 items-center gap-2 pb-2">
        <div className="flex items-center">
          <SortArrow label={label} dir="asc" pressed={dir === 'asc'} onClick={() => onChangeDir('asc')} />
          <SortArrow label={label} dir="desc" pressed={dir === 'desc'} onClick={() => onChangeDir('desc')} />
        </div>
        <BriefToggle brief={brief} onClick={onToggleBrief} />
      </div>
    </div>
  )
}

/**
 * 一个排序方向。上箭头升序，下箭头降序。
 *
 * @param props.label 字段名，读屏时和方向连在一起
 * @param props.dir 升序或降序
 * @param props.pressed 当前是不是正在用这个方向
 * @param props.onClick 点下去换成这个排序
 * @returns 箭头按钮
 */
function SortArrow({ label, dir, pressed, onClick }: { label: string; dir: DeckSortDir; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={dir === 'asc' ? `${label}升序` : `${label}降序`}
      aria-pressed={pressed}
      className={`px-0.5 text-base leading-none ${pressed ? 'text-[#e6c36a]' : 'text-[#8d8276]'}`}
      onClick={onClick}
    >
      {dir === 'asc' ? '↑' : '↓'}
    </button>
  )
}

/**
 * 详略切换。点一下在整张卡和只留名字、类型、冷却之间换。
 *
 * @param props.brief 当前是不是简略展示
 * @param props.onClick 切换详略
 * @returns 箭头右侧的切换按钮
 */
function BriefToggle({ brief, onClick }: { brief: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={brief}
      aria-label={brief ? '简略' : '详细'}
      className={`px-0.5 text-sm font-semibold leading-none ${brief ? 'text-[#e6c36a]' : 'text-[#8d8276]'}`}
      onClick={onClick}
    >
      {brief ? '略' : '详'}
    </button>
  )
}
