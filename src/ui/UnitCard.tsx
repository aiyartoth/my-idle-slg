import { cardTypeLine } from '../data/cardType'
import { RARITY_EDGE_CLASS, RARITY_LABEL, RARITY_TEXT_CLASS, skillLine, type UnitCardData } from '../data/cards'

/**
 * 用文字列表展示一张单位卡。
 * 第一行是名字、类型行和冷却，再下面是攻防、移动、速度和范围。
 * 有技能时另起一行，写成「名字 ~ 效果」，整行左对齐。没进战斗的，行首写未实现。
 * 简略时只留第一行和类型行，方便一行排两张。
 * 名字和左侧色条用稀有度的颜色。
 *
 * @param props.card 要展示的单位卡
 * @param props.brief 为真时只显示名字、类型行和冷却
 * @returns 卡牌列表模块
 */
export function UnitCard({ card, brief = false }: { card: UnitCardData; brief?: boolean }) {
  const typeLine = cardTypeLine(card)
  const rarity = RARITY_LABEL[card.rarity]
  if (brief) {
    return (
      <article
        className={`h-full overflow-hidden rounded-xl border-l-4 bg-[#f4efe6] px-2.5 py-2 text-[#241f1a] ${RARITY_EDGE_CLASS[card.rarity]}`}
        aria-label={`${card.name}，稀有度 ${rarity}，${typeLine}，冷却 ${card.cd}`}
      >
        <div className="flex items-baseline gap-1">
          <h2 className={`min-w-0 flex-1 truncate text-sm font-semibold ${RARITY_TEXT_CLASS[card.rarity]}`}>{card.name}</h2>
          <p className="shrink-0 text-xs tabular-nums">CD {card.cd}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-[#6d6256]">{typeLine}</p>
      </article>
    )
  }
  return (
    <article
      className={`overflow-hidden rounded-xl border-l-4 bg-[#f4efe6] text-[#241f1a] ${RARITY_EDGE_CLASS[card.rarity]}`}
      aria-label={`${card.name}，稀有度 ${rarity}，${typeLine}，冷却 ${card.cd}，攻击 ${card.atk}，血量 ${card.hp}，移动 ${card.move}，速度 ${card.speed}，范围 ${card.range}`}
    >
      <div className="flex items-baseline gap-2 px-3 py-2.5">
        <h2 className={`shrink-0 text-base font-semibold ${RARITY_TEXT_CLASS[card.rarity]}`}>{card.name}</h2>
        <p className="min-w-0 flex-1 text-sm text-[#6d6256]">{typeLine}</p>
        <p className="shrink-0 text-sm tabular-nums">CD {card.cd}</p>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[#e4dccd] px-3 py-2.5 text-sm">
        <span>攻击 {card.atk}</span>
        <span>血量 {card.hp}</span>
        <span>移动 {card.move}</span>
        <span>速度 {card.speed}</span>
        <span>范围 {card.range}</span>
      </div>
      {card.skills.map((skill) => (
        <p key={skill.name} className="border-t border-[#e4dccd] px-3 py-2.5 text-left text-sm leading-5">
          {skillLine(skill)}
        </p>
      ))}
    </article>
  )
}
