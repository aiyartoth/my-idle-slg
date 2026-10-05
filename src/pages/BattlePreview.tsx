import { useState } from 'react'
import type { ReactNode } from 'react'
import { describeModule } from '../battle/modules'
import type { BattleResult, DamageTotal, RoundHit, RoutTotal } from '../battle/resolveBattle'
import { resolveBattle } from '../battle/resolveBattle'
import {
  PRESET_SPEAR_BACK,
  PRESET_SPEAR_FRONT,
  SLOT_LABEL,
  SQUAD_SIZE,
  UNIT_HINT,
  UNIT_IDS,
  UNIT_LABEL,
  UNIT_STATS,
  isUnitId,
} from '../battle/units'
import type { Formation, Slot, UnitId } from '../battle/units'

/** 编制阶段可以改兵，开战之后锁定，直到玩家返回调整 */
type Phase = { name: 'prepare' } | { name: 'battle'; battle: BattleResult; shownRound: number }

/**
 * 手机宽度的战斗预览。
 * 开战前选兵，战斗中只推进回合和看战报。
 *
 * @returns 编制页或战斗页
 */
export default function BattlePreview() {
  const [player, setPlayer] = useState<Formation>(PRESET_SPEAR_BACK.player)
  const [enemy, setEnemy] = useState<Formation>(PRESET_SPEAR_BACK.enemy)
  const [phase, setPhase] = useState<Phase>({ name: 'prepare' })
  const [selectedId, setSelectedId] = useState('formation')

  /**
   * 用当前编制结算，并进入不可改兵的战斗阶段。
   * 同时把说明切到战斗模块。
   */
  function startBattle() {
    setSelectedId('battle')
    setPhase({ name: 'battle', battle: resolveBattle(player, enemy), shownRound: 1 })
  }

  const fighting = phase.name === 'battle'
  const shownRound = fighting ? phase.shownRound : 0
  const battle = fighting ? phase.battle : null
  const finished = battle !== null && shownRound >= battle.rounds
  const visibleLog = battle?.log.slice(0, shownRound) ?? []

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-[#1a1613] text-[#f4efe6]">
      <header className="px-4 pt-4">
        <p className="text-[11px] tracking-[0.18em] text-[#c8b49a]">放置军团</p>
        <h1 className="mt-1 text-2xl font-semibold">{fighting ? '战斗' : '编制'}</h1>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pt-4 pb-44">
        {fighting && battle ? (
          <BattleView
            player={player}
            enemy={enemy}
            battle={battle}
            shownRound={shownRound}
            finished={finished}
            visibleHits={visibleLog}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : (
          <PrepareView
            player={player}
            enemy={enemy}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onPlayer={setPlayer}
            onEnemy={setEnemy}
          />
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-md border-t border-[#3a322b] bg-[#1a1613]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <ModuleExplain selectedId={selectedId} />
        <div className="mt-2">
          {fighting && battle && !finished ? (
            <ActionButton label="下一回合" onClick={() => setPhase({ ...phase, shownRound: shownRound + 1 })} />
          ) : null}
          {finished ? (
            <ActionButton
              label="调整编制"
              onClick={() => {
                setSelectedId('formation')
                setPhase({ name: 'prepare' })
              }}
            />
          ) : null}
          {!fighting ? <ActionButton label="开战" onClick={startBattle} /> : null}
        </div>
      </div>
    </div>
  )
}

/**
 * 开战前的双方编制。预设和兵种选择只出现在这一页。
 *
 * @param props.player 我方编制
 * @param props.enemy 敌方编制
 * @param props.onPlayer 写回我方
 * @param props.onEnemy 写回敌方
 * @returns 编制页
 */
function PrepareView({
  player,
  enemy,
  selectedId,
  onSelect,
  onPlayer,
  onEnemy,
}: {
  player: Formation
  enemy: Formation
  selectedId: string
  onSelect: (id: string) => void
  onPlayer: (formation: Formation) => void
  onEnemy: (formation: Formation) => void
}) {
  return (
    <>
      <div id="module-formation" className="flex gap-2">
        <PresetButton
          label="枪在后排"
          active={sameFormation(player, PRESET_SPEAR_BACK.player) && sameFormation(enemy, PRESET_SPEAR_BACK.enemy)}
          onClick={() => {
            onPlayer(PRESET_SPEAR_BACK.player)
            onEnemy(PRESET_SPEAR_BACK.enemy)
          }}
        />
        <PresetButton
          label="枪在前排"
          active={sameFormation(player, PRESET_SPEAR_FRONT.player) && sameFormation(enemy, PRESET_SPEAR_FRONT.enemy)}
          onClick={() => {
            onPlayer(PRESET_SPEAR_FRONT.player)
            onEnemy(PRESET_SPEAR_FRONT.enemy)
          }}
        />
      </div>
      <FormationEditor
        moduleId="player"
        title="我方"
        formation={player}
        selectedId={selectedId}
        onSelect={onSelect}
        onChange={onPlayer}
      />
      <FormationEditor
        moduleId="enemy"
        title="敌方"
        formation={enemy}
        selectedId={selectedId}
        onSelect={onSelect}
        onChange={onEnemy}
      />
    </>
  )
}

/**
 * 战斗中的对阵、逐回合伤害和结束时的击溃名单。
 * 这里不渲染兵种选择。
 *
 * @param props.player 开战时锁住的我方编制
 * @param props.enemy 开战时锁住的敌方编制
 * @param props.battle 整场结算
 * @param props.shownRound 已经展示到的回合
 * @param props.finished 是否已经打完
 * @param props.visibleHits 已展示回合
 * @returns 战斗页
 */
function BattleView({
  player,
  enemy,
  battle,
  shownRound,
  finished,
  visibleHits,
  selectedId,
  onSelect,
}: {
  player: Formation
  enemy: Formation
  battle: BattleResult
  shownRound: number
  finished: boolean
  visibleHits: BattleResult['log']
  selectedId: string
  onSelect: (id: string) => void
}) {
  const latest = visibleHits[visibleHits.length - 1]
  const tone =
    battle.result === 'win' ? 'text-[#7dcea0]' : battle.result === 'lose' ? 'text-[#e07a7a]' : 'text-[#e6d3b1]'

  return (
    <>
      <button
        id="module-battle"
        type="button"
        onClick={() => onSelect('battle')}
        className={`text-left text-sm text-[#c8b49a] ${selectedId === 'battle' ? 'underline' : ''}`}
      >
        第 {shownRound} / {battle.rounds} 回合
      </button>
      <div className="grid grid-cols-2 gap-2">
        <LockedSide
          moduleId="player"
          title="我方"
          formation={player}
          frontHp={latest?.playerFrontHp ?? stackMaxHp(player.front)}
          backHp={latest?.playerBackHp ?? stackMaxHp(player.back)}
          barClass="bg-[#7dcea0]"
          selectedId={selectedId}
          onSelect={onSelect}
        />
        <LockedSide
          moduleId="enemy"
          title="敌方"
          formation={enemy}
          frontHp={latest?.enemyFrontHp ?? stackMaxHp(enemy.front)}
          backHp={latest?.enemyBackHp ?? stackMaxHp(enemy.back)}
          barClass="bg-[#e07a7a]"
          selectedId={selectedId}
          onSelect={onSelect}
        />
      </div>
      {visibleHits.map((round) => (
        <RoundCard
          key={round.round}
          round={round.round}
          playerHits={round.playerHits}
          enemyHits={round.enemyHits}
          selectedId={selectedId}
          onSelect={onSelect}
        />
      ))}
      {finished ? (
        <section id="module-report" className="rounded-xl bg-[#f4efe6] p-4 text-[#241f1a]">
          <h2 className={`text-lg font-semibold ${tone}`}>{battle.lines[0]}</h2>
          <p className="mt-2 text-sm leading-6">{battle.lines[1]}</p>
          <DamageBlock
            domId="module-player-damage"
            title="我方造成的伤害"
            rows={battle.playerDamage}
            selectedId={selectedId}
            onSelect={onSelect}
          />
          <DamageBlock
            domId="module-enemy-damage"
            title="敌方造成的伤害"
            rows={battle.enemyDamage}
            selectedId={selectedId}
            onSelect={onSelect}
          />
          <RoutBlock
            domId="module-enemy-rout"
            title="击溃敌方"
            rows={battle.enemyRout}
            selectedId={selectedId}
            onSelect={onSelect}
          />
          <RoutBlock
            domId="module-player-rout"
            title="我方损失"
            rows={battle.playerRout}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </section>
      ) : null}
    </>
  )
}

/**
 * 一回合里双方各自打出的伤害。
 *
 * @param props.round 回合序号
 * @param props.playerHits 我方这一回合的攻击
 * @param props.enemyHits 敌方这一回合的攻击
 * @returns 回合卡片
 */
function RoundCard({
  round,
  playerHits,
  enemyHits,
  selectedId,
  onSelect,
}: {
  round: number
  playerHits: RoundHit[]
  enemyHits: RoundHit[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <section id={`module-round-${round}`} className="rounded-xl bg-[#2a241f] p-3">
      <SelectButton id="round" selectedId={selectedId} onSelect={onSelect} className="text-sm font-semibold text-[#e6d3b1]">
        回合 {round}
      </SelectButton>
      <HitList title="我方" hits={playerHits} selectedId={selectedId} onSelect={onSelect} />
      <HitList title="敌方" hits={enemyHits} selectedId={selectedId} onSelect={onSelect} />
    </section>
  )
}

/**
 * 一组攻击，写成「兵种对兵种造成多少伤害」。
 *
 * @param props.title 我方或敌方
 * @param props.hits 这一侧本回合的攻击
 * @returns 伤害列表
 */
function HitList({
  title,
  hits,
  selectedId,
  onSelect,
}: {
  title: string
  hits: RoundHit[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="mt-2">
      <p className="text-xs text-[#a89886]">{title}</p>
      {hits.length === 0 ? <p className="mt-1 text-sm text-[#d9cec1]">没有打出攻击</p> : null}
      <ul className="mt-1 space-y-1">
        {hits.map((hit, index) => (
          <li key={`${hit.attackerSlot}-${hit.attacker}-${index}`}>
            <button
              type="button"
              onClick={() => onSelect(hit.attacker)}
              className={`w-full rounded px-1 py-1 text-left text-sm leading-6 ${
                selectedId === hit.attacker ? 'bg-[#3d342c]' : ''
              }`}
            >
              {SLOT_LABEL[hit.attackerSlot]}
              {UNIT_LABEL[hit.attacker]} 对 {UNIT_LABEL[hit.target]} 造成 {hit.damage}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * 整场按兵种加总的伤害。
 *
 * @param props.title 区块标题
 * @param props.rows 伤害合计
 * @returns 汇总列表
 */
function DamageBlock({
  domId,
  title,
  rows,
  selectedId,
  onSelect,
}: {
  domId: string
  title: string
  rows: DamageTotal[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div id={domId} className="mt-4">
      <SelectButton id="damage" selectedId={selectedId} onSelect={onSelect} className="text-sm font-semibold">
        {title}
      </SelectButton>
      {rows.length === 0 ? <p className="mt-1 text-sm">没有造成伤害</p> : null}
      <ul className="mt-1 space-y-1 text-sm leading-6">
        {rows.map((row) => (
          <li key={`${row.attacker}-${row.target}`}>
            <button
              type="button"
              onClick={() => onSelect(row.attacker)}
              className={`w-full rounded px-1 py-1 text-left ${selectedId === row.attacker ? 'bg-[#e7e0d4]' : ''}`}
            >
              {UNIT_LABEL[row.attacker]} 对 {UNIT_LABEL[row.target]} 造成 {row.damage}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * 被打掉的人数。剩余人数写在括号里，方便和生命条对照。
 *
 * @param props.title 区块标题
 * @param props.rows 击溃统计
 * @returns 击溃列表
 */
function RoutBlock({
  domId,
  title,
  rows,
  selectedId,
  onSelect,
}: {
  domId: string
  title: string
  rows: RoutTotal[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div id={domId} className="mt-4">
      <SelectButton id="rout" selectedId={selectedId} onSelect={onSelect} className="text-sm font-semibold">
        {title}
      </SelectButton>
      {rows.length === 0 ? <p className="mt-1 text-sm">没有兵种被击溃</p> : null}
      <ul className="mt-1 space-y-1 text-sm leading-6">
        {rows.map((row) => (
          <li key={row.unitId}>
            <button
              type="button"
              onClick={() => onSelect(row.unitId)}
              className={`w-full rounded px-1 py-1 text-left ${selectedId === row.unitId ? 'bg-[#e7e0d4]' : ''}`}
            >
              {UNIT_LABEL[row.unitId]} {row.lost} 人{row.remaining > 0 ? `（剩 ${row.remaining}）` : ''}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * 战斗中锁定的一侧编制和两条生命。
 *
 * @param props.title 我方或敌方
 * @param props.formation 锁定的前后排
 * @param props.frontHp 前排当前生命
 * @param props.backHp 后排当前生命
 * @param props.barClass 生命条颜色
 * @returns 对阵卡
 */
function LockedSide({
  moduleId,
  title,
  formation,
  frontHp,
  backHp,
  barClass,
  selectedId,
  onSelect,
}: {
  moduleId: 'player' | 'enemy'
  title: string
  formation: Formation
  frontHp: number
  backHp: number
  barClass: string
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <section id={`module-${moduleId}`} className={`rounded-xl bg-[#f4efe6] p-3 text-[#241f1a] ${ring(selectedId === moduleId)}`}>
      <SelectButton id={moduleId} selectedId={selectedId} onSelect={onSelect} className="text-sm font-semibold">
        {title}
      </SelectButton>
      <StackLine
        side={moduleId}
        slot="front"
        unitId={formation.front}
        hp={frontHp}
        barClass={barClass}
        selectedId={selectedId}
        onSelect={onSelect}
      />
      <StackLine
        side={moduleId}
        slot="back"
        unitId={formation.back}
        hp={backHp}
        barClass={barClass}
        selectedId={selectedId}
        onSelect={onSelect}
      />
    </section>
  )
}

/**
 * 一格兵的名字和生命条。
 *
 * @param props.slot 前排或后排
 * @param props.unitId 兵种
 * @param props.hp 当前生命
 * @param props.barClass 生命条颜色
 * @returns 一行编制
 */
function StackLine({
  side,
  slot,
  unitId,
  hp,
  barClass,
  selectedId,
  onSelect,
}: {
  side: 'player' | 'enemy'
  slot: Slot
  unitId: UnitId
  hp: number
  barClass: string
  selectedId: string
  onSelect: (id: string) => void
}) {
  const maxHp = stackMaxHp(unitId)
  const pct = maxHp === 0 ? 0 : Math.max(0, Math.round((hp / maxHp) * 100))
  return (
    <button
      id={`module-${side}-${slot}`}
      type="button"
      onClick={() => onSelect(unitId)}
      className={`mt-2 w-full rounded text-left ${ring(selectedId === unitId)}`}
    >
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span>
          {SLOT_LABEL[slot]} {UNIT_LABEL[unitId]}
        </span>
        <span className="tabular-nums text-[#6d6256]">{pct}%</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded bg-[#e4dccd]">
        <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </button>
  )
}

/**
 * 开战前编辑一侧的前后排。每格 100 人，只改兵种。
 *
 * @param props.title 我方或敌方
 * @param props.formation 当前编制
 * @param props.onChange 写回整侧编制
 * @returns 编制卡
 */
function FormationEditor({
  moduleId,
  title,
  formation,
  selectedId,
  onSelect,
  onChange,
}: {
  moduleId: 'player' | 'enemy'
  title: string
  formation: Formation
  selectedId: string
  onSelect: (id: string) => void
  onChange: (formation: Formation) => void
}) {
  return (
    <section id={`module-${moduleId}`} className={`rounded-xl bg-[#f4efe6] p-4 text-[#241f1a] ${ring(selectedId === moduleId)}`}>
      <SelectButton id={moduleId} selectedId={selectedId} onSelect={onSelect} className="text-base font-semibold">
        {title}
      </SelectButton>
      <div className="mt-3 space-y-3">
        {(['front', 'back'] as const).map((slot) => (
          <div key={slot} id={`module-${moduleId}-${slot}`} className="text-sm">
            <SelectButton id={slot} selectedId={selectedId} onSelect={onSelect} className="text-[#6d6256]">
              {SLOT_LABEL[slot]} · {SQUAD_SIZE}
            </SelectButton>
            <select
              className={`mt-1 min-h-11 w-full rounded-lg border border-[#d9d0c1] bg-white px-3 py-3 text-base ${ring(selectedId === formation[slot])}`}
              value={formation[slot]}
              aria-label={`${title}${SLOT_LABEL[slot]}`}
              onFocus={() => onSelect(formation[slot])}
              onChange={(event) => {
                if (!isUnitId(event.target.value)) return
                onChange({ ...formation, [slot]: event.target.value })
                onSelect(event.target.value)
              }}
            >
              {UNIT_IDS.map((unitId) => (
                <option key={unitId} value={unitId}>
                  {UNIT_LABEL[unitId]} · {UNIT_HINT[unitId]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </section>
  )
}

/**
 * 底部说明条。当前点选的 id 决定显示哪一段说明。
 *
 * @param props.selectedId 模块 id 或兵种 id
 * @returns 说明条
 */
function ModuleExplain({ selectedId }: { selectedId: string }) {
  const note = describeModule(selectedId)
  return (
    <div id="module-explain">
      <p className="text-[11px] tracking-wide text-[#c8b49a]">
        {note.id} · {note.title}
      </p>
      <p className="mt-1 text-sm leading-5 text-[#f4efe6]">{note.summary}</p>
    </div>
  )
}

/**
 * 可点选的模块标题。点下去用 id 切换说明。
 *
 * @param props.id 模块 id
 * @param props.selectedId 当前选中的 id
 * @param props.onSelect 写入选中 id
 * @param props.className 标题样式
 * @param props.children 标题文字
 * @returns 按钮
 */
function SelectButton({
  id,
  selectedId,
  onSelect,
  className,
  children,
}: {
  id: string
  selectedId: string
  onSelect: (id: string) => void
  className?: string
  children: ReactNode
}) {
  return (
    <button type="button" onClick={() => onSelect(id)} className={`text-left ${className ?? ''}`}>
      {children}
      {selectedId === id ? <span className="sr-only">，已选中</span> : null}
    </button>
  )
}

/**
 * 选中模块时的描边。
 *
 * @param active 是否就是当前 id
 * @returns Tailwind 类名
 */
function ring(active: boolean): string {
  return active ? 'ring-2 ring-[#c8b49a]' : ''
}

/**
 * 编制页上的预设。
 *
 * @param props.label 按钮文字
 * @param props.active 是否正是这场预设
 * @param props.onClick 填入预设
 * @returns 按钮
 */
function PresetButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 flex-1 rounded-full border px-3 text-sm ${
        active ? 'border-[#e6d3b1] bg-[#f4efe6] text-[#241f1a]' : 'border-[#8d6844] text-[#f4efe6]'
      }`}
    >
      {label}
    </button>
  )
}

/**
 * 贴在底部的主操作。一屏只有一个主动作。
 *
 * @param props.label 按钮文字
 * @param props.onClick 点击后的阶段切换
 * @returns 主按钮
 */
function ActionButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-12 w-full rounded-xl bg-[#f4efe6] text-base font-semibold text-[#241f1a]"
    >
      {label}
    </button>
  )
}

/**
 * 一格兵的开战生命。
 *
 * @param unitId 兵种
 * @returns 人数乘上单兵生命
 */
function stackMaxHp(unitId: UnitId): number {
  return UNIT_STATS[unitId].hp * SQUAD_SIZE
}

/**
 * 比较两套编制是否相同。
 *
 * @param left 一侧编制
 * @param right 另一侧编制
 * @returns 前后排兵种都一致时为 true
 */
function sameFormation(left: Formation, right: Formation): boolean {
  return left.front === right.front && left.back === right.back
}
