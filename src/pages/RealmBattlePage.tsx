import type { ReactNode, RefObject } from 'react'
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { BoardUnit, BattleActor, BattleEvent, BattleStrike, DamageDetail, HandCard, UnitRoute } from '../realm/battle'
import { BOARD_SIZE, type TileKind } from '../realm/board'
import { skillLine } from '../data/cards'
import { formatLoot, type RealmLoot } from '../data/drops'
import { ensureYellowTurbanBattle, exitBattle, getSession, markBattleSettled, retainBattleView, subscribeSession } from '../realm/battleSession'

/** 沿一格滑动的时间。移动力最多 2，两格走完仍赶在下一名兵行动之前 */
const MOVE_STEP_MS = 320

/** 卡牌落到格子上时，螺旋召唤的时长。要和样式里的 --summon-ms 一起用 */
const SUMMON_MS = 500

/**
 * 秘境战斗。目前只有黄巾之乱，其他 id 先当作还没开放。
 *
 * @returns 棋盘战或未开放说明
 */
export default function RealmBattlePage() {
  const { realmId } = useParams()
  if (realmId !== 'yellow-turban') {
    return (
      <div className="px-4 py-4">
        <p>这个秘境还没开放。</p>
        <Link to="/realm" className="mt-3 inline-block text-sm text-[#c8b49a]">
          返回秘境
        </Link>
      </div>
    )
  }
  return <YellowTurbanBattle />
}

/**
 * 黄巾之乱自动打完。下方是我方还在冷却的牌，日志收在右上角。
 *
 * @returns 战斗场面
 */
function YellowTurbanBattle() {
  const navigate = useNavigate()
  const session = useSyncExternalStore(subscribeSession, getSession)
  const [logOpen, setLogOpen] = useState(false)
  const [settledStamp, setSettledStamp] = useState(-1)
  useEffect(() => {
    ensureYellowTurbanBattle()
    return retainBattleView()
  }, [])
  if (session.status === 'idle' || session.realmId !== 'yellow-turban') {
    return <p className="px-4 py-4 text-sm text-[#c8b49a]">正在进入战场。</p>
  }
  const battle = session.battle
  const finished = battle.result !== 'ongoing'
  const stamp = battle.history.length
  const animationDone = settledStamp === stamp
  const loot = session.status === 'unconfirmed' ? session.loot : null
  const lootReady = finished && animationDone && battle.result === 'win' && loot !== null
  const showExit = finished && (battle.result !== 'win' || lootReady)
  const leave = () => {
    exitBattle()
    navigate('/realm')
  }
  const onSettled = (nextStamp: number) => {
    setSettledStamp(nextStamp)
    markBattleSettled(nextStamp)
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 px-3 pt-3">
        <h1 className="text-lg font-semibold">黄巾之乱</h1>
        <p className="text-sm font-semibold tabular-nums">回合 {Math.max(battle.turn, 1)}</p>
        <div className="flex shrink-0 items-center gap-3 text-sm">
          <button type="button" aria-expanded={logOpen} onClick={() => setLogOpen(true)} className="text-[#f4efe6]">
            日志
          </button>
          <button type="button" className="text-[#c8b49a]" onClick={leave}>
            退出秘境
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
        <Board
          tiles={battle.tiles}
          units={battle.units}
          routes={battle.routes}
          strike={battle.strike}
          stamp={stamp}
          onSettled={onSettled}
          playerBaseHp={battle.playerBaseHp}
          enemyBaseHp={battle.enemyBaseHp}
          playerHand={battle.playerHand.length}
          playerDeck={battle.playerDeck.length}
          enemyHand={battle.enemyHand.length}
          enemyDeck={battle.enemyDeck.length}
        />
        <TerrainLegend />
      </div>
      {lootReady && loot ? <VictoryToast loot={loot} /> : null}
      <CooldownQueue cards={battle.playerHand} />
      {showExit ? (
        <div className="shrink-0 border-t border-[#3a322b] bg-[#1a1613] px-3 py-3">
          <button type="button" className="w-full rounded-xl bg-[#f4efe6] py-3 text-sm font-semibold text-[#241f1a]" onClick={leave}>
            退出
          </button>
        </div>
      ) : null}
      {logOpen ? <BattleLog history={battle.history} onClose={() => setLogOpen(false)} /> : null}
    </div>
  )
}

/**
 * 胜利后停在战场中间的提示。不自动离开，等玩家点底部的退出。
 *
 * @param props.loot 这一场已经入账的战利品
 * @returns 居中的胜利提示
 */
function VictoryToast({ loot }: { loot: RealmLoot }) {
  const lines = formatLoot(loot).split(' · ')
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center px-8">
      <div className="w-full rounded-2xl bg-[#2a241f] px-4 py-4 text-center ring-1 ring-[#5c4a32]" role="status">
        <p className="text-lg font-semibold">胜利</p>
        <ul className="mt-2 space-y-1 text-sm leading-6 text-[#e6c36a]">
          {lines.map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/**
 * 我方还在冷却、等待召唤的牌。一行两张，只留名字、剩余冷却、攻击和血量。
 * 冷却到 0 并成功上场后会离开这里。
 *
 * @param props.cards 我方手牌
 * @returns 贴在战场下方的队列
 */
function CooldownQueue({ cards }: { cards: readonly HandCard[] }) {
  return (
    <section className="border-t border-[#3a322b] bg-[#1a1613] px-3 pt-2 pb-3" aria-label="召唤队列">
      <h2 className="text-xs tracking-wide text-[#c8b49a]">召唤队列</h2>
      {cards.length === 0 ? <p className="mt-2 text-sm text-[#a89886]">没有等待冷却的卡牌</p> : null}
      <ul className="mt-2 grid grid-cols-2 gap-2">
        {cards.map((card) => (
          <li key={card.uid} className="min-w-0 rounded-lg bg-[#2a241f] px-2.5 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-semibold">{card.card.name}</p>
              <p className="shrink-0 text-sm tabular-nums">CD {card.cd}</p>
            </div>
            <p className="mt-1 text-[11px] text-[#c8b49a]">
              攻击 {card.card.atk} · 血量 {card.card.hp}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * 从右上角打开的战报。点单位名可以看属性和这一击的算法。
 *
 * @param props.history 整场累计的战报
 * @param props.onClose 关掉日志
 * @returns 日志层
 */
function BattleLog({ history, onClose }: { history: readonly BattleEvent[]; onClose: () => void }) {
  const [picked, setPicked] = useState<{ actor: BattleActor; detail?: DamageDetail } | null>(null)
  return (
    <div className="fixed inset-0 z-50 bg-black/40">
      <div className="relative mx-auto flex h-full w-full max-w-md flex-col bg-[#1a1613] text-[#f4efe6]">
      <div className="flex items-center justify-between border-b border-[#3a322b] px-3 py-3">
        <h2 className="text-base font-semibold">战斗日志</h2>
        <button type="button" onClick={onClose} className="rounded-full px-3 py-1.5 text-sm text-[#c8b49a]">
          关闭
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {history.length === 0 ? <p className="text-sm text-[#a89886]">战斗还没开始。</p> : null}
        <ol className="space-y-3">
          {groupByTurn(history).map((group) => (
            <li key={group.turn}>
              <p className="text-xs tracking-wide text-[#c8b49a]">第 {group.turn} 回合</p>
              <ul className="mt-1 space-y-1 text-sm leading-6">
                {group.events.map((event, index) => (
                  <li key={`${group.turn}-${index}`}>
                    <LogLine event={event} onPick={setPicked} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
      {picked ? <UnitSheet actor={picked.actor} detail={picked.detail} onClose={() => setPicked(null)} /> : null}
      </div>
    </div>
  )
}

/**
 * 一行战报。单位名是按钮，点开后看属性和伤害来源。
 *
 * @param props.event 一条记录
 * @param props.onPick 选中单位
 * @returns 一行文字
 */
function LogLine({
  event,
  onPick,
}: {
  event: BattleEvent
  onPick: (picked: { actor: BattleActor; detail?: DamageDetail }) => void
}) {
  if (event.kind === 'note' || event.kind === 'end') return <span>{event.text}</span>
  if (event.kind === 'draw') {
    return (
      <span>
        {sideName(event.actor.side)}抽到 <ActorButton actor={event.actor} onPick={onPick} />
      </span>
    )
  }
  if (event.kind === 'summon') {
    return (
      <span>
        {sideName(event.actor.side)}召唤 <ActorButton actor={event.actor} onPick={onPick} />
      </span>
    )
  }
  if (event.kind === 'nospace') {
    return (
      <span>
        <ActorButton actor={event.actor} onPick={onPick} /> 没有空位，无法召唤
      </span>
    )
  }
  if (event.kind === 'death') {
    return (
      <span>
        <ActorButton actor={event.actor} onPick={onPick} /> 被击破
      </span>
    )
  }
  if (event.kind === 'heal') {
    return (
      <span>
        <ActorButton actor={event.actor} onPick={onPick} /> 为 <ActorButton actor={event.target} onPick={onPick} /> 回复 {event.amount}
      </span>
    )
  }
  if (event.kind === 'base') {
    return (
      <span>
        <ActorButton actor={event.attacker} onPick={onPick} /> 对{event.base === 'enemy' ? '黄巾大本营' : '我方大本营'}造成 {event.damage}
      </span>
    )
  }
  return (
    <span>
      <ActorButton actor={event.attacker} detail={event.detail} onPick={onPick} /> 对{' '}
      <ActorButton actor={event.target} onPick={onPick} /> 造成 {event.detail.damage}
    </span>
  )
}

/**
 * 日志里的单位名。
 *
 * @param props.actor 单位快照
 * @param props.detail 如果来自一击，带上伤害拆解
 * @param props.onPick 打开浮层
 * @returns 按钮
 */
function ActorButton({
  actor,
  detail,
  onPick,
}: {
  actor: BattleActor
  detail?: DamageDetail
  onPick: (picked: { actor: BattleActor; detail?: DamageDetail }) => void
}) {
  return (
    <button type="button" onClick={() => onPick({ actor, detail })} className="underline decoration-[#c8b49a] underline-offset-2">
      {actor.card.name}
    </button>
  )
}

/**
 * 单位浮层。基础和技能来自卡面，科技、增益、减益还没进战斗。
 *
 * @param props.actor 点中的单位
 * @param props.detail 这一击的计算。从抽牌、召唤点进来时没有
 * @param props.onClose 回到日志
 * @returns 浮层
 */
function UnitSheet({
  actor,
  detail,
  onClose,
}: {
  actor: BattleActor
  detail?: DamageDetail
  onClose: () => void
}) {
  const card = actor.card
  return (
    <div className="absolute inset-x-0 bottom-0 max-h-[78%] overflow-y-auto rounded-t-2xl bg-[#f4efe6] px-4 pt-4 pb-6 text-[#241f1a]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">{card.name}</h3>
          <p className="text-sm text-[#6d6256]">
            {sideName(actor.side)} · {card.attackKind === 'spell' ? '法术' : '物理'}
            {actor.hp !== undefined ? ` · 当时生命 ${actor.hp}` : ''}
          </p>
        </div>
        <button type="button" onClick={onClose} className="text-sm text-[#6d6256]">
          关闭
        </button>
      </div>
      <SourceBlock title="基础">
        <p>攻击 {card.atk}</p>
        <p>血量 {card.hp}</p>
        <p>移动 {card.move}</p>
        <p>速度 {card.speed}</p>
        <p>范围 {card.range}</p>
        <p>冷却 {card.cd}</p>
      </SourceBlock>
      <SourceBlock title="技能">{card.skills.length === 0 ? <p>无</p> : card.skills.map((skill) => <p key={skill.name}>{skillLine(skill)}</p>)}</SourceBlock>
      <SourceBlock title="科技">
        <p>暂无</p>
      </SourceBlock>
      <SourceBlock title="增益">
        <p>暂无</p>
      </SourceBlock>
      <SourceBlock title="减益">
        <p>暂无</p>
      </SourceBlock>
      {detail ? <DamageBlock detail={detail} /> : null}
    </div>
  )
}

/**
 * 浮层里的一块来源。
 *
 * @param props.title 基础、技能、科技、增益或减益
 * @param props.children 这一块的内容
 * @returns 小节
 */
function SourceBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-3 border-t border-[#e4dccd] pt-2 text-sm leading-6">
      <h4 className="font-semibold">{title}</h4>
      {children}
    </section>
  )
}

/**
 * 这一击怎么算出来的。
 *
 * @param props.detail 伤害拆解
 * @returns 计算说明
 */
function DamageBlock({ detail }: { detail: DamageDetail }) {
  const armorName = detail.kind === 'spell' ? '魔甲' : '重甲'
  const pierceName = detail.kind === 'spell' ? '法术穿透' : '破甲'
  return (
    <section className="mt-3 border-t border-[#e4dccd] pt-2 text-sm leading-6">
      <h4 className="font-semibold">伤害</h4>
      <p>基础攻击 {detail.baseAtk}</p>
      <p>额外攻击 {detail.extraAtk}</p>
      <p>
        {armorName} {detail.armor}，{pierceName} {detail.pierce}
      </p>
      <p>减免 {detail.reduced}</p>
      <p>
        实际伤害 {detail.baseAtk} + {detail.extraAtk} - {detail.reduced} = {detail.damage}
      </p>
    </section>
  )
}

/**
 * 按回合把战报分组，日志里每一拍放在一起。
 *
 * @param history 累计战报
 * @returns 回合和该回合的记录
 */
function groupByTurn(history: readonly BattleEvent[]): { turn: number; events: BattleEvent[] }[] {
  const groups: { turn: number; events: BattleEvent[] }[] = []
  for (const event of history) {
    const last = groups[groups.length - 1]
    if (!last || last.turn !== event.turn) groups.push({ turn: event.turn, events: [event] })
    else last.events.push(event)
  }
  return groups
}

/**
 * 日志里的阵营称呼。
 *
 * @param side 我方或黄巾
 * @returns 称呼
 */
function sideName(side: BattleActor['side']): string {
  return side === 'player' ? '我方' : '黄巾'
}

/** 棋盘上正在滑动的一名兵。生命先保持移动前的值，滑完再换成结算后的 */
interface ShownUnit {
  uid: string
  side: BoardUnit['side']
  card: BoardUnit['card']
  hp: number
  row: number
  col: number
  /** 心灵之火等临时攻击。没有时棋盘上只显示卡面攻击 */
  bonusAtk?: number
}

/**
 * 10×10 棋盘。兵浮在格子上，按本回合路径一格格滑过去。大本营血量写在营区正中。
 *
 * @param props.tiles 地形
 * @param props.units 结算后还站着的兵
 * @param props.routes 这一回合每人走过的格子
 * @param props.strike 这一步的攻击。没有攻击时为空
 * @param props.stamp 当前局面的序号。动画播完才回传同一个序号
 * @param props.onSettled 这一步的滑动结束后调用
 * @param props.playerBaseHp 我方大本营生命
 * @param props.enemyBaseHp 黄巾大本营生命
 * @param props.playerHand 我方手牌张数
 * @param props.playerDeck 我方牌库剩余张数
 * @param props.enemyHand 黄巾手牌张数
 * @param props.enemyDeck 黄巾牌库剩余张数
 * @returns 棋盘
 */
function Board({
  tiles,
  units,
  routes,
  strike,
  stamp,
  onSettled,
  playerBaseHp,
  enemyBaseHp,
  playerHand,
  playerDeck,
  enemyHand,
  enemyDeck,
}: {
  tiles: TileKind[][]
  units: readonly BoardUnit[]
  routes: readonly UnitRoute[]
  strike: BattleStrike | null
  stamp: number
  onSettled: (stamp: number) => void
  playerBaseHp: number
  enemyBaseHp: number
  playerHand: number
  playerDeck: number
  enemyHand: number
  enemyDeck: number
}) {
  const boardRef = useRef<HTMLDivElement>(null)
  const shown = useSlidingUnits(units, routes, strike, stamp, onSettled)
  const summoning = useSummoning(units)
  const cue = shown.arrived ? strike : null
  const gapTotal = 1 * (BOARD_SIZE - 1)
  const playerBase = baseBlock(tiles, 'playerBase')
  const enemyBase = baseBlock(tiles, 'enemyBase')
  return (
    <div ref={boardRef} className="relative mt-3" style={{ ['--summon-ms' as string]: `${SUMMON_MS}ms` }}>
      <div className="grid grid-cols-10 gap-px" role="grid" aria-label="战场">
        {tiles.map((row, rowIndex) =>
          row.map((tile, col) => (
            <div key={`${rowIndex}-${col}`} role="gridcell" aria-label={cellLabel(tile)} className={`aspect-square rounded-[2px] ${tileClass(tile)}`} />
          )),
        )}
      </div>
      {playerBase ? (
        <BaseHp block={playerBase} hp={playerBaseHp} hand={playerHand} deck={playerDeck} label="我方大本营" gapTotal={gapTotal} struck={strikeHitsBlock(cue, playerBase)} />
      ) : null}
      {enemyBase ? (
        <BaseHp block={enemyBase} hp={enemyBaseHp} hand={enemyHand} deck={enemyDeck} label="黄巾大本营" gapTotal={gapTotal} struck={strikeHitsBlock(cue, enemyBase)} />
      ) : null}
      {shown.units.map((unit) => (
        <div
          key={unit.uid}
          aria-label={unitLabel(unit)}
          className={`absolute z-10 flex flex-col items-center justify-center overflow-hidden rounded-[2px] ${unit.side === 'player' ? 'bg-[#d7ead4] text-[#1d3a28]' : 'bg-[#f0d0cc] text-[#5c2424]'} ${strikeRing(unit.uid, cue)} ${summoning.has(unit.uid) ? 'battle-summon-unit' : ''}`}
          style={{
            ...cellBox(unit.row, unit.col, gapTotal),
            transitionProperty: shown.sliding ? 'left, top' : 'none',
            transitionDuration: `${MOVE_STEP_MS}ms`,
            transitionTimingFunction: 'linear',
          }}
        >
          <span className="line-clamp-2 w-full px-px text-center text-[9px] leading-[1.05] font-semibold">{unit.card.name}</span>
          <span className="text-[9px] leading-none tabular-nums">
            {unit.card.atk + (unit.bonusAtk ?? 0)}/{unit.hp}
          </span>
        </div>
      ))}
      {shown.units
        .filter((unit) => summoning.has(unit.uid))
        .map((unit) => (
          <div key={`summon-${unit.uid}`} aria-hidden className="pointer-events-none absolute z-20" style={cellBox(unit.row, unit.col, gapTotal)}>
            <SummonSpiral side={unit.side} />
          </div>
        ))}
      <AttackCue boardRef={boardRef} strike={cue} />
    </div>
  )
}

/**
 * 这一格在棋盘上的位置和大小。兵和召唤螺旋共用，避免两层对不齐。
 *
 * @param row 行，从上方数
 * @param col 列，从左方数
 * @param gapTotal 棋盘所有格缝的总宽度
 * @returns 绝对定位用的宽高和坐标
 */
function cellBox(row: number, col: number, gapTotal: number): { width: string; height: string; left: string; top: string } {
  const cell = `((100% - ${gapTotal}px) / ${BOARD_SIZE})`
  return {
    width: `calc(${cell})`,
    height: `calc(${cell})`,
    left: `calc(${col} * (${cell} + 1px))`,
    top: `calc(${row} * (${cell} + 1px))`,
  }
}

/**
 * 新落到棋盘上的兵。开局已经在场上的不算。螺旋只留半秒。
 *
 * @param units 这一步结算后还站着的兵
 * @returns 正在播放召唤螺旋的 uid
 */
function useSummoning(units: readonly BoardUnit[]): ReadonlySet<string> {
  const knownRef = useRef<Set<string>>(new Set())
  const [active, setActive] = useState<readonly string[]>([])
  useEffect(() => {
    const fresh = units.map((unit) => unit.uid).filter((uid) => !knownRef.current.has(uid))
    const frame = window.requestAnimationFrame(() => {
      for (const unit of units) knownRef.current.add(unit.uid)
    })
    let timer = 0
    if (fresh.length > 0) {
      setActive(fresh)
      timer = window.setTimeout(() => setActive([]), SUMMON_MS)
    }
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [units])
  return new Set(active)
}

/**
 * 半秒螺旋。从格子外旋进中心，兵同时转出来。
 *
 * @param props.side 我方用亮色，对方用红色
 * @returns 盖在格子上的螺旋
 */
function SummonSpiral({ side }: { side: BoardUnit['side'] }) {
  const color = side === 'player' ? '#f6d98a' : '#ff8d7a'
  return (
    <svg viewBox="0 0 32 32" className="battle-summon-spiral absolute top-1/2 left-1/2 h-[160%] w-[160%] overflow-visible">
      <path
        className="battle-summon-stroke"
        d="M16 14 a2 2 0 1 1 -0.1 0 a4 4 0 1 0 0.1 0 a6 6 0 1 1 -0.1 0 a8 8 0 1 0 0.1 0 a10 10 0 1 1 -0.1 0"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        pathLength="100"
      />
    </svg>
  )
}

/**
 * 攻击方用亮圈，被击的兵用红圈。打大本营时不在兵身上画圈。
 *
 * @param uid 这一格上的兵
 * @param strike 这一步的攻击
 * @returns 高亮用的圈
 */
function strikeRing(uid: string, strike: BattleStrike | null): string {
  if (!strike) return ''
  if (uid === strike.attackerUid) return 'ring-2 ring-[#f6d98a]'
  if (uid === strike.targetUid) return 'ring-2 ring-[#ff5a5a]'
  return ''
}

/**
 * 这一击有没有落在这块大本营上。
 *
 * @param strike 这一步的攻击
 * @param block 营区矩形
 * @returns 落点在营区里时为 true
 */
function strikeHitsBlock(strike: BattleStrike | null, block: BaseBlock): boolean {
  if (!strike || strike.targetUid) return false
  return strike.to.row >= block.row && strike.to.row < block.row + block.rowSpan && strike.to.col >= block.col && strike.to.col < block.col + block.colSpan
}

/**
 * 从攻击落点指向被击点，并在终点飘出伤害或治疗数字。
 *
 * @param props.boardRef 棋盘元素，用来把格子换算成像素
 * @param props.strike 这一步的攻击。没有时不画
 * @returns 箭头和数字
 */
function AttackCue({ boardRef, strike }: { boardRef: RefObject<HTMLDivElement | null>; strike: BattleStrike | null }) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board) return
    const measure = () => {
      const rect = board.getBoundingClientRect()
      setSize({ width: rect.width, height: rect.height })
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(board)
    return () => observer.disconnect()
  }, [boardRef, strike])
  if (!strike || size.width === 0) return null
  const gapTotal = BOARD_SIZE - 1
  const cellW = (size.width - gapTotal) / BOARD_SIZE
  const cellH = (size.height - gapTotal) / BOARD_SIZE
  const center = (row: number, col: number) => ({
    x: col * (cellW + 1) + cellW / 2,
    y: row * (cellH + 1) + cellH / 2,
  })
  const from = center(strike.from.row, strike.from.col)
  const to = center(strike.to.row, strike.to.col)
  const dx = to.x - from.x
  const dy = to.y - from.y
  const length = Math.hypot(dx, dy) || 1
  const inset = Math.min(10, length / 3)
  const tail = { x: from.x + (dx / length) * inset, y: from.y + (dy / length) * inset }
  const tip = { x: to.x - (dx / length) * inset, y: to.y - (dy / length) * inset }
  const heal = strike.kind === 'heal'
  const text = heal ? `+${strike.amount}` : `-${strike.amount}`
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <marker id="battle-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill={heal ? '#6dcea0' : '#ff5a5a'} />
          </marker>
        </defs>
        <line x1={tail.x} y1={tail.y} x2={tip.x} y2={tip.y} stroke={heal ? '#6dcea0' : '#ff5a5a'} strokeWidth="2" markerEnd="url(#battle-arrow)" />
      </svg>
      <span
        className={`pointer-events-none absolute z-20 text-sm font-bold tabular-nums ${heal ? 'text-[#6dcea0]' : 'text-[#ff5a5a]'}`}
        style={{ left: to.x, top: to.y, animation: 'battle-number 0.8s ease-out both' }}
      >
        {text}
      </span>
    </>
  )
}

/**
 * 把本回合的路径拆成逐格位移。先画在起点，再一格格滑到终点，最后换成结算后的局面。
 *
 * @param units 结算后还站着的兵
 * @param routes 这一回合每人走过的格子
 * @param strike 这一步的攻击。被击倒的兵在这一步里仍留在落点上
 * @param stamp 当前局面的序号
 * @param onSettled 滑动结束，或这一步本来就不用滑时调用
 * @returns 当前画在棋盘上的兵、是否正在滑动，以及这一步是否已经落到终点
 */
function useSlidingUnits(
  units: readonly BoardUnit[],
  routes: readonly UnitRoute[],
  strike: BattleStrike | null,
  stamp: number,
  onSettled: (stamp: number) => void,
): { units: readonly ShownUnit[]; sliding: boolean; arrived: boolean } {
  const beforeRef = useRef(units)
  const [shown, setShown] = useState<ShownUnit[]>(() => units.map(toShown))
  const [sliding, setSliding] = useState(false)
  const [arrivedStamp, setArrivedStamp] = useState<number | null>(null)
  const onSettledRef = useRef(onSettled)
  onSettledRef.current = onSettled

  useEffect(() => {
    const fromUnits = beforeRef.current
    const commitFrame = window.requestAnimationFrame(() => {
      beforeRef.current = units
    })
    const before = new Map(fromUnits.map((unit) => [unit.uid, unit]))
    const after = new Map(units.map((unit) => [unit.uid, unit]))
    const routeOf = new Map(routes.map((route) => [route.uid, route.path]))
    const ids = [...new Set([...before.keys(), ...after.keys()])]
    const snapshot = (uid: string, step: number): ShownUnit | undefined => {
      const live = after.get(uid)
      const old = before.get(uid)
      const unit = old ?? live
      if (!unit) return undefined
      const fallback = live ?? unit
      const path = routeOf.get(uid) ?? [{ row: fallback.row, col: fallback.col }]
      const point = path[Math.min(step, path.length - 1)]
      return { uid, side: unit.side, card: unit.card, hp: unit.hp, bonusAtk: unit.bonusAtk, row: point.row, col: point.col }
    }
    const maxStep = Math.max(0, ...ids.map((uid) => (routeOf.get(uid)?.length ?? 1) - 1))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || maxStep === 0) {
      setSliding(false)
      setShown(keepStruckTarget(units.map(toShown), before, strike))
      setArrivedStamp(stamp)
      onSettledRef.current(stamp)
      return
    }
    let cancelled = false
    let enableFrame = 0
    let moveFrame = 0
    const timers: number[] = []
    setSliding(false)
    setShown(ids.flatMap((uid) => snapshot(uid, 0) ?? []))
    enableFrame = window.requestAnimationFrame(() => {
      if (cancelled) return
      setSliding(true)
      moveFrame = window.requestAnimationFrame(() => {
        if (cancelled) return
        let step = 0
        const advance = () => {
          if (cancelled) return
          step += 1
          setShown(ids.flatMap((uid) => snapshot(uid, step) ?? []))
          const finish = () => {
            if (cancelled) return
            setShown(keepStruckTarget(units.map(toShown), before, strike))
            setSliding(false)
            setArrivedStamp(stamp)
            onSettledRef.current(stamp)
          }
          timers.push(window.setTimeout(step < maxStep ? advance : finish, MOVE_STEP_MS))
        }
        advance()
      })
    })
    return () => {
      cancelled = true
      window.cancelAnimationFrame(commitFrame)
      window.cancelAnimationFrame(enableFrame)
      window.cancelAnimationFrame(moveFrame)
      timers.forEach((timer) => window.clearTimeout(timer))
    }
    // 上一帧局面在 effect 里从 beforeRef 读取。不能在渲染或 cleanup 里提前写成这一步的结果，否则被击倒的兵会在攻击出现前消失。
    // 也不能把上一帧局面放进依赖，否则滑动中的重绘会把起点盖成终点。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, routes, strike, stamp])

  return { units: shown, sliding, arrived: arrivedStamp === stamp }
}

/**
 * 被这一击打倒的兵，结算后已经离场，这一步里仍画在被击的格子上。
 *
 * @param live 结算后还站着的兵
 * @param before 这一步开始前的兵
 * @param strike 这一步的攻击
 * @returns 加上被击倒的兵之后的列表
 */
function keepStruckTarget(live: readonly ShownUnit[], before: Map<string, BoardUnit>, strike: BattleStrike | null): ShownUnit[] {
  if (!strike?.targetUid || live.some((unit) => unit.uid === strike.targetUid)) return [...live]
  const old = before.get(strike.targetUid)
  if (!old) return [...live]
  const hp = strike.kind === 'heal' ? old.hp + strike.amount : Math.max(0, old.hp - strike.amount)
  return [...live, { uid: old.uid, side: old.side, card: old.card, hp, bonusAtk: old.bonusAtk, row: strike.to.row, col: strike.to.col }]
}

/**
 * 结算后的兵，停在最终格子上。
 *
 * @param unit 场上的兵
 * @returns 不再滑动的显示数据
 */
function toShown(unit: BoardUnit): ShownUnit {
  return { uid: unit.uid, side: unit.side, card: unit.card, hp: unit.hp, bonusAtk: unit.bonusAtk, row: unit.row, col: unit.col }
}

/**
 * 地形图例，方便对照棋盘上的颜色。
 *
 * @returns 图例
 */
function TerrainLegend() {
  return (
    <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#c8b49a]">
      <span>森林</span>
      <span>河流</span>
      <span>石头</span>
      <span>绿营为我方</span>
      <span>红营为黄巾</span>
    </p>
  )
}

/** 一整块大本营在棋盘上占的矩形 */
interface BaseBlock {
  row: number
  col: number
  rowSpan: number
  colSpan: number
}

/**
 * 找出一侧大本营占的矩形，用来把血量放在营区正中。
 *
 * @param tiles 棋盘
 * @param kind 我方或黄巾大本营
 * @returns 左上角和占的行列数。没有这种格子时为 null
 */
function baseBlock(tiles: readonly (readonly TileKind[])[], kind: 'playerBase' | 'enemyBase'): BaseBlock | null {
  let minRow = BOARD_SIZE
  let maxRow = -1
  let minCol = BOARD_SIZE
  let maxCol = -1
  tiles.forEach((row, rowIndex) => {
    row.forEach((tile, col) => {
      if (tile !== kind) return
      minRow = Math.min(minRow, rowIndex)
      maxRow = Math.max(maxRow, rowIndex)
      minCol = Math.min(minCol, col)
      maxCol = Math.max(maxCol, col)
    })
  })
  if (maxRow < 0) return null
  return { row: minRow, col: minCol, rowSpan: maxRow - minRow + 1, colSpan: maxCol - minCol + 1 }
}

/**
 * 盖在大本营上的血量。覆盖整块营区并居中。
 *
 * @param props.block 营区矩形
 * @param props.hp 当前生命
 * @param props.hand 手牌张数
 * @param props.deck 牌库剩余张数
 * @param props.label 读屏用的营名
 * @param props.gapTotal 棋盘所有格缝的总宽度
 * @param props.struck 这一击打在这块营上
 * @returns 居中的血量和手牌/牌库
 */
function BaseHp({
  block,
  hp,
  hand,
  deck,
  label,
  gapTotal,
  struck,
}: {
  block: BaseBlock
  hp: number
  hand: number
  deck: number
  label: string
  gapTotal: number
  struck: boolean
}) {
  const cell = `((100% - ${gapTotal}px) / ${BOARD_SIZE})`
  return (
    <div
      aria-label={`${label}，血量 ${hp}，手牌 ${hand}，卡组 ${deck}`}
      className={`pointer-events-none absolute z-30 flex flex-col items-center justify-center text-[#f4efe6] tabular-nums ${struck ? 'ring-2 ring-[#ff5a5a] ring-inset' : ''}`}
      style={{
        left: `calc(${block.col} * (${cell} + 1px))`,
        top: `calc(${block.row} * (${cell} + 1px))`,
        width: `calc(${block.colSpan} * ${cell} + ${block.colSpan - 1}px)`,
        height: `calc(${block.rowSpan} * ${cell} + ${block.rowSpan - 1}px)`,
      }}
    >
      <span className="text-sm font-semibold leading-none">{hp}</span>
      <span className="mt-1 text-xs font-semibold leading-none text-[#ffe7a3]">{hand}/{deck}</span>
    </div>
  )
}

/**
 * 格子的底色。兵另外浮在上面，这里只留地形。
 *
 * @param tile 地形
 * @returns Tailwind 类名
 */
function tileClass(tile: TileKind): string {
  if (tile === 'forest') return 'bg-[#2f5a3a]'
  if (tile === 'river') return 'bg-[#2d5f78]'
  if (tile === 'stone') return 'bg-[#6a6258]'
  if (tile === 'playerBase') return 'bg-[#3e6b4f]'
  if (tile === 'enemyBase') return 'bg-[#7a3d3d]'
  return 'bg-[#3a322b]'
}

/**
 * 给格子读出来的说明。
 *
 * @param tile 地形
 * @returns 读屏文字
 */
function cellLabel(tile: TileKind): string {
  if (tile === 'forest') return '森林'
  if (tile === 'river') return '河流'
  if (tile === 'stone') return '石头'
  if (tile === 'playerBase') return '我方大本营'
  if (tile === 'enemyBase') return '黄巾大本营'
  return '空地'
}

/**
 * 浮在格子上的兵，读屏用。
 *
 * @param unit 正在显示的兵
 * @returns 阵营、名字和生命
 */
function unitLabel(unit: ShownUnit): string {
  return `${unit.side === 'player' ? '我方' : '黄巾'}${unit.card.name}，攻击 ${unit.card.atk + (unit.bonusAtk ?? 0)}，血量 ${unit.hp}`
}
