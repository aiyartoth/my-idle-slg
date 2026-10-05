import {
  BACK_MELEE_OUTPUT,
  COUNTER,
  MAX_ROUNDS,
  RANGED_FRONT_TAKEN,
  ROUT_PERCENT,
  SLOT_LABEL,
  SQUAD_SIZE,
  UNIT_LABEL,
  UNIT_STATS,
} from './units'
import type { Formation, Slot, UnitId } from './units'

/** 胜负。双方都没在 6 回合内跌破 20% 时为 draw */
export type BattleOutcome = 'win' | 'lose' | 'draw'

/** 某一击打在哪个兵种上，回合日志和伤害汇总都用它 */
export interface RoundHit {
  attacker: UnitId
  attackerSlot: Slot
  target: UnitId
  targetSlot: Slot
  damage: number
}

/** 一场里某兵种对某兵种打出的伤害合计 */
export interface DamageTotal {
  attacker: UnitId
  target: UnitId
  damage: number
}

/** 一个兵种被打掉的人数。同一兵种占两格时合并计数 */
export interface RoutTotal {
  unitId: UnitId
  lost: number
  remaining: number
}

/** 回合结束时四个兵堆的剩余生命，以及这一回合双方打出的伤害 */
export interface RoundSnapshot {
  round: number
  playerFrontHp: number
  playerBackHp: number
  enemyFrontHp: number
  enemyBackHp: number
  playerPct: number
  enemyPct: number
  playerHits: RoundHit[]
  enemyHits: RoundHit[]
}

/** 一次攻击。战报从整场攻击里挑句子，不手写文案 */
interface AttackHit {
  round: number
  attacker: UnitId
  attackerSlot: Slot
  target: UnitId
  targetSlot: Slot
  damage: number
  outputPct: number
  counterPct: number
  takenPct: number
}

/** 纯函数的结算结果。同一编制连续调用两次，日志应完全一致 */
export interface BattleResult {
  result: BattleOutcome
  rounds: number
  playerPct: number
  enemyPct: number
  lines: [string, string, string]
  log: RoundSnapshot[]
  playerDamage: DamageTotal[]
  enemyDamage: DamageTotal[]
  playerRout: RoutTotal[]
  enemyRout: RoutTotal[]
}

interface LiveStack {
  slot: Slot
  unitId: UnitId
  hp: number
  maxHp: number
  atk: number
  def: number
}

interface Side {
  front: LiveStack
  back: LiveStack
  maxHp: number
}

/**
 * 计算一次攻击的伤害。
 * 公式与战斗预览文档一致，只在最后向下取整。
 *
 * @param atk 攻击方攻击，已经乘过人数
 * @param counterPct 克制百分数
 * @param outputPct 出力百分数
 * @param takenPct 承伤百分数
 * @param def 防守方兵种防御
 * @returns 本次伤害
 */
export function calcDamage(
  atk: number,
  counterPct: number,
  outputPct: number,
  takenPct: number,
  def: number,
): number {
  return Math.floor((atk * counterPct) / 100 * (outputPct / 100) * (takenPct / 100) * (100 / (100 + def)))
}

/**
 * 把编制变成可扣血的双方。
 * 人数固定，防御保持兵种原值。
 *
 * @param formation 前排与后排兵种
 * @returns 带开战生命上限的一方
 */
function createSide(formation: Formation): Side {
  const toStack = (slot: Slot, unitId: UnitId): LiveStack => {
    const stats = UNIT_STATS[unitId]
    const hp = stats.hp * SQUAD_SIZE
    return {
      slot,
      unitId,
      hp,
      maxHp: hp,
      atk: stats.atk * SQUAD_SIZE,
      def: stats.def,
    }
  }
  const front = toStack('front', formation.front)
  const back = toStack('back', formation.back)
  return { front, back, maxHp: front.maxHp + back.maxHp }
}

/**
 * 按站位选择这一击打谁。
 * 前排冲锋兵绕过后排；其余兵种先打还活着的前排。
 *
 * @param attacker 本回合开始时的攻击兵堆
 * @param enemy 本回合开始时的敌方
 * @returns 还活着的目标；双方都已阵亡时为空
 */
function pickTarget(attacker: LiveStack, enemy: Side): LiveStack | null {
  const chargerInFront = attacker.slot === 'front' && UNIT_STATS[attacker.unitId].role === 'charger'
  if (chargerInFront && enemy.back.hp > 0) {
    return enemy.back
  }
  if (enemy.front.hp > 0) return enemy.front
  if (enemy.back.hp > 0) return enemy.back
  return null
}

/**
 * 后排近战和冲锋兵在己方前排还活着时只打一半。
 * 弓兵、弩兵不受这条例外，前排一律全额。
 *
 * @param attacker 攻击兵堆
 * @param ownFrontAlive 本回合开始时己方前排是否还有生命
 * @returns 出力百分数
 */
function outputPct(attacker: LiveStack, ownFrontAlive: boolean): number {
  const ranged = UNIT_STATS[attacker.unitId].role === 'ranged'
  const backMelee = attacker.slot === 'back' && !ranged && ownFrontAlive
  return backMelee ? BACK_MELEE_OUTPUT : 100
}

/**
 * 远程兵种站在前排时额外挨打，用来让站错位能在数字里看见。
 *
 * @param target 被打的兵堆
 * @returns 承伤百分数
 */
function takenPct(target: LiveStack): number {
  if (target.slot === 'front' && UNIT_STATS[target.unitId].role === 'ranged') return RANGED_FRONT_TAKEN
  return 100
}

/**
 * 总生命是否已经低于开战值的 20%。
 * 用原始生命比较，不用四舍五入后的百分比，避免刚好卡在 20% 时提前停。
 *
 * @param hp 当前总生命
 * @param maxHp 开战总生命
 * @returns 跌破溃败线时为 true
 */
function isRouted(hp: number, maxHp: number): boolean {
  return hp * 100 < maxHp * ROUT_PERCENT
}

/**
 * 把剩余生命换成界面上的整数百分比。
 *
 * @param hp 当前总生命
 * @param maxHp 开战总生命
 * @returns 四舍五入后的百分比
 */
function hpPercent(hp: number, maxHp: number): number {
  return Math.round((hp / maxHp) * 100)
}

/**
 * 收集一方本回合的攻击。伤害先记下来，等双方都算完再扣血。
 *
 * @param round 当前回合
 * @param own 攻击方
 * @param enemy 防守方
 * @returns 本回合这个方向的攻击列表
 */
function planSideHits(round: number, own: Side, enemy: Side): AttackHit[] {
  const ownFrontAlive = own.front.hp > 0
  const hits: AttackHit[] = []
  for (const attacker of [own.front, own.back]) {
    if (attacker.hp <= 0) continue
    const target = pickTarget(attacker, enemy)
    if (!target) continue
    const counter = COUNTER[attacker.unitId][target.unitId]
    const output = outputPct(attacker, ownFrontAlive)
    const taken = takenPct(target)
    hits.push({
      round,
      attacker: attacker.unitId,
      attackerSlot: attacker.slot,
      target: target.unitId,
      targetSlot: target.slot,
      damage: calcDamage(attacker.atk, counter, output, taken, target.def),
      outputPct: output,
      counterPct: counter,
      takenPct: taken,
    })
  }
  return hits
}

/**
 * 克制系数更高的一击优先；相同则取更早回合，再优先前排。
 * 战报第二行要用这一击解释「站位有没有打满」。
 *
 * @param current 目前选中的一击
 * @param next 待比较的一击
 * @returns 更该写进战报的那一击
 */
function preferCounterHit(current: AttackHit | null, next: AttackHit): AttackHit {
  if (!current) return next
  if (next.counterPct !== current.counterPct) {
    return next.counterPct > current.counterPct ? next : current
  }
  if (next.round !== current.round) return next.round < current.round ? next : current
  if (next.attackerSlot === 'front' && current.attackerSlot === 'back') return next
  return current
}

/**
 * 伤害更高的一击优先，伤害相同取更早回合。
 *
 * @param current 目前选中的一击
 * @param next 待比较的一击
 * @returns 伤害更高的那一击
 */
function preferHarderHit(current: AttackHit | null, next: AttackHit): AttackHit {
  if (!current) return next
  if (next.damage !== current.damage) return next.damage > current.damage ? next : current
  return next.round < current.round ? next : current
}

/**
 * 拼出三行战报。
 * 第二行锁定我方克制最高的一击；出力只有一半时，补一行站到前排的对照伤害。
 *
 * @param result 胜负
 * @param rounds 实际打完的回合数
 * @param playerPct 我方剩余生命百分比
 * @param enemyPct 敌方剩余生命百分比
 * @param playerHits 我方全部攻击
 * @param enemyHits 敌方全部攻击
 * @returns 固定三行文案
 */
function buildLines(
  result: BattleOutcome,
  rounds: number,
  playerPct: number,
  enemyPct: number,
  playerHits: AttackHit[],
  enemyHits: AttackHit[],
): [string, string, string] {
  const outcome =
    result === 'win'
      ? `胜。第 ${rounds} 回合敌方兵力 ${enemyPct}%，我方 ${playerPct}%。`
      : result === 'lose'
        ? `败。第 ${rounds} 回合我方兵力 ${playerPct}%，敌方 ${enemyPct}%。`
        : `平局。打满 ${rounds} 回合，我方兵力 ${playerPct}%，敌方 ${enemyPct}%。`

  const featured = playerHits.reduce<AttackHit | null>(preferCounterHit, null)
  const featuredLine = featured ? formatFeaturedHit(featured) : '我方没有打出攻击。'

  const backHit = enemyHits.filter((hit) => hit.targetSlot === 'back').reduce<AttackHit | null>(preferHarderHit, null)
  const enemyLine = backHit
    ? formatEnemyHit(backHit, true)
    : formatEnemyHit(enemyHits.reduce<AttackHit | null>(preferHarderHit, null), false)

  return [outcome, featuredLine, enemyLine]
}

/**
 * 描述我方最能说明克制的那一击。
 * 出力为 50 时，用同一目标和同一承伤再算一次全额出力。
 *
 * @param hit 被选中的我方攻击
 * @returns 战报第二行
 */
function formatFeaturedHit(hit: AttackHit): string {
  const attacker = UNIT_LABEL[hit.attacker]
  const target = UNIT_LABEL[hit.target]
  const verb = hit.counterPct > 100 ? `克制${target}` : `攻击${target}`
  if (hit.outputPct === BACK_MELEE_OUTPUT) {
    const atk = UNIT_STATS[hit.attacker].atk * SQUAD_SIZE
    const full = calcDamage(atk, hit.counterPct, 100, hit.takenPct, UNIT_STATS[hit.target].def)
    return `${attacker}${verb}，实际伤害 ${hit.damage}；站到前排则是 ${full}。`
  }
  return `${attacker}${verb}，实际伤害 ${hit.damage}。`
}

/**
 * 描述敌方一击。打到后排的冲锋兵单独写成「切后排」。
 *
 * @param hit 敌方攻击，整场没有攻击时为空
 * @param cutBack 这一击是否打在后排
 * @returns 战报第三行
 */
function formatEnemyHit(hit: AttackHit | null, cutBack: boolean): string {
  if (!hit) return '敌方没有打出攻击。'
  const attacker = UNIT_LABEL[hit.attacker]
  const target = UNIT_LABEL[hit.target]
  if (cutBack && UNIT_STATS[hit.attacker].role === 'charger') {
    return `敌方${attacker}切后排${target}，伤害 ${hit.damage}。`
  }
  if (cutBack) return `敌方${attacker}打后排${target}，伤害 ${hit.damage}。`
  return `敌方${attacker}打${SLOT_LABEL[hit.targetSlot]}${target}，伤害 ${hit.damage}。`
}

/**
 * 丢掉战报挑句子才需要的系数，留下回合日志要展示的一击。
 *
 * @param hit 结算内部的攻击
 * @returns 给界面的伤害记录
 */
function toRoundHit(hit: AttackHit): RoundHit {
  return {
    attacker: hit.attacker,
    attackerSlot: hit.attackerSlot,
    target: hit.target,
    targetSlot: hit.targetSlot,
    damage: hit.damage,
  }
}

/**
 * 把多次攻击按「谁打谁」加总。
 * 同一兵种前后排都出手时，伤害合并成一行。
 *
 * @param hits 若干次攻击
 * @returns 按出现顺序排列的伤害合计
 */
export function mergeDamage(hits: RoundHit[]): DamageTotal[] {
  const totals = new Map<string, DamageTotal>()
  const order: string[] = []
  for (const hit of hits) {
    const key = `${hit.attacker}:${hit.target}`
    const current = totals.get(key)
    if (current) {
      current.damage += hit.damage
    } else {
      totals.set(key, { attacker: hit.attacker, target: hit.target, damage: hit.damage })
      order.push(key)
    }
  }
  return order.map((key) => totals.get(key) as DamageTotal)
}

/**
 * 按剩余生命折算还站着的人数。
 * 血量为 0 才算整格被击溃；还有残血时至少留下 1 人。
 *
 * @param hp 当前生命
 * @param maxHp 开战生命
 * @returns 剩余人数
 */
function soldiersLeft(hp: number, maxHp: number): number {
  if (hp <= 0) return 0
  const rounded = Math.round((hp / maxHp) * SQUAD_SIZE)
  return Math.max(1, Math.min(SQUAD_SIZE, rounded))
}

/**
 * 统计一侧被击溃的人数。
 * 两格是同一兵种时合成一行，避免战报里盾兵出现两次。
 *
 * @param front 前排
 * @param back 后排
 * @returns 有减员的兵种
 */
function routOfSide(front: LiveStack, back: LiveStack): RoutTotal[] {
  const merged = new Map<UnitId, RoutTotal>()
  for (const stack of [front, back]) {
    const remaining = soldiersLeft(stack.hp, stack.maxHp)
    const row = merged.get(stack.unitId) ?? { unitId: stack.unitId, lost: 0, remaining: 0 }
    row.lost += SQUAD_SIZE - remaining
    row.remaining += remaining
    merged.set(stack.unitId, row)
  }
  return [...merged.values()].filter((row) => row.lost > 0)
}

/**
 * 结算一场预览战斗。
 * 双方按回合开始时的血量同时出招，一方总生命跌破 20% 即停。
 * 同一回合双方都跌破时，剩余比例更高者胜，比例相同则平局。
 *
 * @param player 我方前后排
 * @param enemy 敌方前后排
 * @returns 胜负、三行战报和每回合剩余生命
 */
export function resolveBattle(player: Formation, enemy: Formation): BattleResult {
  const left = createSide(player)
  const right = createSide(enemy)
  const playerHits: AttackHit[] = []
  const enemyHits: AttackHit[] = []
  const log: RoundSnapshot[] = []

  for (let round = 1; round <= MAX_ROUNDS; round += 1) {
    const leftHits = planSideHits(round, left, right)
    const rightHits = planSideHits(round, right, left)
    for (const hit of leftHits) {
      const target = hit.targetSlot === 'front' ? right.front : right.back
      target.hp = Math.max(0, target.hp - hit.damage)
    }
    for (const hit of rightHits) {
      const target = hit.targetSlot === 'front' ? left.front : left.back
      target.hp = Math.max(0, target.hp - hit.damage)
    }
    playerHits.push(...leftHits)
    enemyHits.push(...rightHits)

    const playerHp = left.front.hp + left.back.hp
    const enemyHp = right.front.hp + right.back.hp
    log.push({
      round,
      playerFrontHp: left.front.hp,
      playerBackHp: left.back.hp,
      enemyFrontHp: right.front.hp,
      enemyBackHp: right.back.hp,
      playerPct: hpPercent(playerHp, left.maxHp),
      enemyPct: hpPercent(enemyHp, right.maxHp),
      playerHits: leftHits.map(toRoundHit),
      enemyHits: rightHits.map(toRoundHit),
    })

    const playerRouted = isRouted(playerHp, left.maxHp)
    const enemyRouted = isRouted(enemyHp, right.maxHp)
    if (playerRouted || enemyRouted || round === MAX_ROUNDS) {
      const result = judge(playerRouted, enemyRouted, playerHp / left.maxHp, enemyHp / right.maxHp, round)
      const playerPct = hpPercent(playerHp, left.maxHp)
      const enemyPct = hpPercent(enemyHp, right.maxHp)
      return {
        result,
        rounds: round,
        playerPct,
        enemyPct,
        lines: buildLines(result, round, playerPct, enemyPct, playerHits, enemyHits),
        log,
        playerDamage: mergeDamage(playerHits.map(toRoundHit)),
        enemyDamage: mergeDamage(enemyHits.map(toRoundHit)),
        playerRout: routOfSide(left.front, left.back),
        enemyRout: routOfSide(right.front, right.back),
      }
    }
  }

  throw new Error('战斗回合没有结束')
}

/**
 * 把溃败线收成胜负。
 * 都没溃败说明已经打满回合，判平局。
 *
 * @param playerRouted 我方是否跌破 20%
 * @param enemyRouted 敌方是否跌破 20%
 * @param playerRatio 我方剩余比例
 * @param enemyRatio 敌方剩余比例
 * @param round 当前回合
 * @returns 胜负
 */
function judge(
  playerRouted: boolean,
  enemyRouted: boolean,
  playerRatio: number,
  enemyRatio: number,
  round: number,
): BattleOutcome {
  if (playerRouted && enemyRouted) {
    if (playerRatio === enemyRatio) return 'draw'
    return playerRatio > enemyRatio ? 'win' : 'lose'
  }
  if (enemyRouted) return 'win'
  if (playerRouted) return 'lose'
  if (round === MAX_ROUNDS) return 'draw'
  return 'draw'
}
