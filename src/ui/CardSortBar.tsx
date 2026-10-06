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
 * 选定某一个种族子类时，箭头改成按稀有度升降。
 *
 * @param props.sortKey 当前分类
 * @param props.dir 当前方向。还没点箭头时为空
 * @param props.brief 当前是不是简略展示
 * @param props.ariaLabel 这条工具栏的名字
 * @param props.raceGroups 当前列表里有的种族子类。只有选中种族时才显示
 * @param props.raceGroup 选中的种族子类。空表示全部
 * @param props.onChangeKey 换分类
 * @param props.onChangeDir 换升降序
 * @param props.onChangeRaceGroup 换种族子类
 * @param props.onToggleBrief 在详细和简略之间切换
 * @param props.deckCount 卡组当前张数和上限。图鉴不传，卡组管理显示在箭头左边
 * @returns 固定在页面顶部的排序条
 */
export function CardSortBar({
  sortKey,
  dir,
  brief,
  ariaLabel,
  raceGroups,
  raceGroup,
  onChangeKey,
  onChangeDir,
  onChangeRaceGroup,
  onToggleBrief,
  deckCount,
}: {
  sortKey: DeckSortKey
  dir: DeckSortDir | null
  brief: boolean
  ariaLabel: string
  raceGroups: readonly string[]
  raceGroup: string | null
  onChangeKey: (key: DeckSortKey) => void
  onChangeDir: (dir: DeckSortDir) => void
  onChangeRaceGroup: (group: string | null) => void
  onToggleBrief: () => void
  deckCount?: { current: number; limit: number }
}) {
  const label = sortKey === 'race' && raceGroup ? '稀有度' : (SORT_TABS.find((tab) => tab.key === sortKey)?.label ?? '稀有度')
  return (
    <div role="toolbar" aria-label={ariaLabel}>
      <div className="flex items-center gap-3 border-b border-[#3a322b]">
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
        {deckCount ? (
          <span className="text-xs tabular-nums text-[#c8b49a]" aria-label={`卡组 ${deckCount.current} 张，上限 ${deckCount.limit}`}>
            {deckCount.current}/{deckCount.limit}
          </span>
        ) : null}
        <div className="flex items-center">
          <SortArrow label={label} dir="asc" pressed={dir === 'asc'} onClick={() => onChangeDir('asc')} />
          <SortArrow label={label} dir="desc" pressed={dir === 'desc'} onClick={() => onChangeDir('desc')} />
        </div>
        <BriefToggle brief={brief} onClick={onToggleBrief} />
      </div>
      </div>
      {sortKey === 'race' ? (
        <div className="flex gap-2 overflow-x-auto border-b border-[#3a322b] py-2" role="group" aria-label="种族子类">
          <RaceChip label="全部" pressed={raceGroup === null} onClick={() => onChangeRaceGroup(null)} />
          {raceGroups.map((name) => (
            <RaceChip key={name} label={name} pressed={raceGroup === name} onClick={() => onChangeRaceGroup(name)} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * 种族子类里的一颗。选中时用金色。
 *
 * @param props.label 子类名字，全部也用这个
 * @param props.pressed 当前是不是选中
 * @param props.onClick 点下去换成这个子类
 * @returns 一颗可横向滑动的按钮
 */
function RaceChip({ label, pressed, onClick }: { label: string; pressed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${pressed ? 'bg-[#e6c36a] text-[#241f1a]' : 'bg-[#2a241f] text-[#c8b49a]'}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

/**
 * 种族分组的小标题。简略两列时占满一行。
 *
 * @param props.name 种族子类
 * @returns 列表里的分组标题
 */
export function RaceGroupHeading({ name }: { name: string }) {
  return <h2 className="col-span-2 px-1 pt-2 text-xs font-semibold tracking-wide text-[#e6c36a]">{name}</h2>
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
