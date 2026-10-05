import type { ArmorSkillKind, AttackKind, UnitCardData } from '../data/cards'
import { cellsOf, chooseRoute, keyOf, manhattan, openAround, openSummonTiles, type Coord, type TileKind } from './board'

/** 开战时双方各拿进手的张数 */
const OPENING_HAND = 3

/** 打到这个回合还没分出胜负就停，避免双方都打不穿时一直走 */
const MAX_TURNS = 40

/** 行动队列里，治疗步的前缀。正式移动和攻击仍用单位 uid */
const HEAL_QUEUE_PREFIX = 'heal:'

/** 行动队列里，雷电步的前缀。打完再走位和普攻 */
const BOLT_QUEUE_PREFIX = 'bolt:'

/** 战斗一侧 */
export type Side = 'player' | 'enemy'

/** 胜负。ongoing 表示还在打 */
export type BattleResult = 'ongoing' | 'win' | 'lose' | 'draw'

/** 手里或牌库里的一张牌。uid 用来区分两张同样的黄巾步兵 */
export interface HandCard {
  uid: string
  card: UnitCardData
  /** 剩余冷却。回合开始时减 1，最低停在 0 */
  cd: number
}

/** 已经站在棋盘上的兵 */
export interface BoardUnit {
  uid: string
  side: Side
  card: UnitCardData
  row: number
  col: number
  hp: number
  /** 上场序号。越小越早上场；开局就在场上、分不出先后时用同一个数，再按我方优先 */
  entered: number
}

/** 这一回合某名兵走过的格子，含起点和终点。界面按这个路径逐格滑动 */
export interface UnitRoute {
  uid: string
  path: Coord[]
}

/**
 * 这一步打出的数字。damage 是伤害，heal 是治疗回复的生命。
 * from、to 是攻击落点到被击点，用来画箭头。
 */
export interface BattleStrike {
  attackerUid: string
  from: Coord
  to: Coord
  /** 被打中的兵。打的是大本营时没有 */
  targetUid?: string
  kind: 'damage' | 'heal'
  amount: number
}

/** 一场秘境战的完整局面 */
export interface BattleState {
  turn: number
  result: BattleResult
  /** 我方大本营生命。先固定，以后再独立计算 */
  playerBaseHp: number
  enemyBaseHp: number
  tiles: TileKind[][]
  units: BoardUnit[]
  /** 本回合还没轮到的兵，按行动顺序排。空队列表示该开新回合 */
  queue: string[]
  /** 刚刚这一步走过的格子。一轮里通常只有正在行动的那一名 */
  routes: UnitRoute[]
  /** 刚刚这一步的攻击。没打中任何人时为空 */
  strike: BattleStrike | null
  playerHand: HandCard[]
  playerDeck: HandCard[]
  enemyHand: HandCard[]
  enemyDeck: HandCard[]
  /** 刚刚这一回合的文字，测试和简短回顾用 */
  log: string[]
  /** 整场累计的战报。日志界面按这个列表回放 */
  history: BattleEvent[]
  nextUid: number
  /** 技能里的随机。不传时用 Math.random。撒豆成兵和雷电招来会用到 */
  random?: () => number
}

/** 日志里点到的一名单位。卡面是当时的快照 */
export interface BattleActor {
  side: Side
  card: UnitCardData
  /** 场上实例。抽牌时还没有 */
  uid?: string
  /** 这一刻的生命。手牌不填 */
  hp?: number
}

/** 一击的拆解。科技和 buff 还没进战斗，额外攻击先记 0 */
export interface DamageDetail {
  kind: AttackKind
  /** 卡面基础攻击 */
  baseAtk: number
  /** 科技、增益加上的攻击。目前没有这些来源 */
  extraAtk: number
  /** 对方护甲原值。物理看重甲，法术看魔甲 */
  armor: number
  /** 攻击方穿透。物理看破甲，法术看法术穿透 */
  pierce: number
  /** 实际减免，等于护甲减去穿透后不低于 0 的部分 */
  reduced: number
  damage: number
}

/** 一条战报。单位名可以点开，伤害条带着计算过程 */
export type BattleEvent =
  | { turn: number; kind: 'note'; text: string }
  | { turn: number; kind: 'draw'; actor: BattleActor }
  | { turn: number; kind: 'summon'; actor: BattleActor }
  | { turn: number; kind: 'nospace'; actor: BattleActor }
  | { turn: number; kind: 'hit'; attacker: BattleActor; target: BattleActor; detail: DamageDetail }
  | { turn: number; kind: 'heal'; actor: BattleActor; target: BattleActor; amount: number }
  | { turn: number; kind: 'base'; attacker: BattleActor; base: Side; damage: number }
  | { turn: number; kind: 'death'; actor: BattleActor }
  | { turn: number; kind: 'end'; text: string }

/** 开一场秘境要的牌和棋盘 */
export interface Scenario {
  playerBaseHp: number
  enemyBaseHp: number
  tiles: TileKind[][]
  playerDeck: readonly UnitCardData[]
  enemyDeck: readonly UnitCardData[]
}

/**
 * 按场景摆开局。开战前双方先洗牌，再各摸 3 张。冷却还是牌面的原值，自动战斗开始后才逐回合减少。
 *
 * @param scenario 大本营生命、棋盘和双方牌库
 * @param random 洗牌用的随机数，返回 0 到 1。之后撒豆成兵和雷电招来也用它
 * @returns 第 0 回合的局面
 */
export function createBattle(scenario: Scenario, random: () => number = Math.random): BattleState {
  let nextUid = 1
  const pack = (cards: readonly UnitCardData[]): HandCard[] =>
    cards.map((card) => ({ uid: `u${nextUid++}`, card, cd: card.cd }))
  const player = pack(shuffleDeck(scenario.playerDeck, random))
  const enemy = pack(shuffleDeck(scenario.enemyDeck, random))
  return {
    turn: 0,
    result: 'ongoing',
    playerBaseHp: scenario.playerBaseHp,
    enemyBaseHp: scenario.enemyBaseHp,
    tiles: scenario.tiles,
    units: [],
    queue: [],
    routes: [],
    strike: null,
    playerHand: player.slice(0, OPENING_HAND),
    playerDeck: player.slice(OPENING_HAND),
    enemyHand: enemy.slice(0, OPENING_HAND),
    enemyDeck: enemy.slice(OPENING_HAND),
    log: ['开战前，双方洗牌', openingLine('我方', player.slice(0, OPENING_HAND)), openingLine('黄巾', enemy.slice(0, OPENING_HAND))],
    history: [
      { turn: 0, kind: 'note', text: '开战前，双方洗牌' },
      { turn: 0, kind: 'note', text: openingLine('我方', player.slice(0, OPENING_HAND)) },
      { turn: 0, kind: 'note', text: openingLine('黄巾', enemy.slice(0, OPENING_HAND)) },
    ],
    nextUid,
    random,
  }
}

/**
 * 起手写进战报。洗牌之后前 3 张就是这一手。
 *
 * @param who 我方或黄巾
 * @param cards 起手的牌
 * @returns 一行战报
 */
function openingLine(who: string, cards: readonly HandCard[]): string {
  if (cards.length === 0) return `${who}起手没有牌`
  return `${who}起手 ${cards.map((card) => card.card.name).join('、')}`
}

/**
 * 开战前打乱一副牌。不改原来的数组。
 *
 * @param cards 牌库原顺序
 * @param random 返回 0 到 1
 * @returns 洗过的新数组
 */
export function shuffleDeck<T>(cards: readonly T[], random: () => number): T[] {
  const next = [...cards]
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.floor(random() * (index + 1)))
    const held = next[index]
    next[index] = next[swap]
    next[swap] = held
  }
  return next
}

/**
 * 把整回合走完：先冷却、抽牌、召唤，再按顺序让每名兵各行动一次。
 * 新抽到的牌这一回合不减冷却。没有空位的牌留在手里，冷却停在 0。
 *
 * @param state 当前局面
 * @returns 这一回合全部行动结束后的局面。已经分出胜负时原样返回
 */
export function stepBattle(state: BattleState): BattleState {
  if (state.result !== 'ongoing') return state
  const log: string[] = []
  const routes: UnitRoute[] = []
  let next = beginRound(state)
  log.push(...next.log)
  while (next.queue.length > 0 && next.result === 'ongoing') {
    next = actNext(next)
    log.push(...next.log)
    routes.push(...next.routes)
  }
  return { ...next, log, routes }
}

/**
 * 战斗往前走一步。队列空着就开新回合；否则结算下一名还活着的兵。
 * 有治疗时先回复，有雷电时再打雷电，然后移动并攻击。伤害立刻生效，后面的兵看到的是这一步之后的局面。
 *
 * @param state 当前局面
 * @returns 这一步之后的局面。已经分出胜负时原样返回
 */
export function advanceBattle(state: BattleState): BattleState {
  if (state.result !== 'ongoing') return state
  if (state.queue.length === 0) return beginRound(state)
  return actNext(state)
}

/**
 * 回合开始。手里已有的牌减冷却，再抽牌、召唤。场上有撒豆成兵的，再在周围召一只黄巾兵，然后按速度排好行动队列。
 *
 * @param state 上一个回合结束后的局面
 * @returns 召唤完、还没人移动的局面
 */
function beginRound(state: BattleState): BattleState {
  const turn = state.turn + 1
  const log: string[] = []
  const events: BattleEvent[] = []
  let nextUid = state.nextUid
  let playerHand = tickHand(state.playerHand)
  let enemyHand = tickHand(state.enemyHand)
  const drawnPlayer = drawCard(playerHand, state.playerDeck, 'player', turn, log, events)
  const drawnEnemy = drawCard(enemyHand, state.enemyDeck, 'enemy', turn, log, events)
  playerHand = drawnPlayer.hand
  enemyHand = drawnEnemy.hand
  let units = state.units.map((unit) => ({ ...unit }))
  const playerSummon = summonSide('player', playerHand, units, state.tiles, turn, log, events, nextUid)
  playerHand = playerSummon.hand
  units = playerSummon.units
  nextUid = playerSummon.nextUid
  const enemySummon = summonSide('enemy', enemyHand, units, state.tiles, turn, log, events, nextUid)
  enemyHand = enemySummon.hand
  units = enemySummon.units
  nextUid = enemySummon.nextUid
  const scattered = scatterBeans(units, state.tiles, turn, log, events, nextUid, state.random ?? Math.random)
  units = scattered.units
  nextUid = scattered.nextUid
  const queue = [...units].sort(actingOrder).flatMap(queuedSteps)
  const next = {
    ...state,
    turn,
    units,
    queue,
    routes: [],
    strike: null,
    playerHand,
    playerDeck: drawnPlayer.deck,
    enemyHand,
    enemyDeck: drawnEnemy.deck,
    log,
    history: [...state.history, ...events],
    nextUid,
  }
  const result = judge(next, log, events)
  return { ...next, result, queue: result === 'ongoing' ? queue : [], history: [...state.history, ...events] }
}

/**
 * 队列里下一名还在场上的兵行动：有治疗时先回复血量最低的友方，有雷电时再打随机敌人，再走，再打进入范围的敌人或大本营。
 * 已经被击破的直接跳过，不占一次行动。
 *
 * @param state 本回合还有人没动的局面
 * @returns 这一名兵行动完的局面
 */
function actNext(state: BattleState): BattleState {
  const queue = [...state.queue]
  let units = state.units.map((unit) => ({ ...unit }))
  while (queue.length > 0 && !tokenAlive(queue[0], units)) queue.shift()
  const token = queue.shift()
  if (!token) return { ...state, queue, routes: [], strike: null, log: [] }
  if (token.startsWith(HEAL_QUEUE_PREFIX)) return healBeforeAction(state, queue, token.slice(HEAL_QUEUE_PREFIX.length))
  if (token.startsWith(BOLT_QUEUE_PREFIX)) return lightningAction(state, queue, token.slice(BOLT_QUEUE_PREFIX.length))
  const uid = token
  const actor = units.find((unit) => unit.uid === uid)
  if (!actor) return { ...state, queue, routes: [], strike: null, log: [] }
  const blocked = new Set(units.filter((other) => other.uid !== actor.uid).map(keyOf))
  const goals = routeGoals(actor, units, state.tiles)
  const path = chooseRoute(actor, actor.card.move, state.tiles, blocked, goals)
  const destination = path[path.length - 1]
  const moved = { ...actor, row: destination.row, col: destination.col }
  units = units.map((unit) => (unit.uid === moved.uid ? moved : unit))
  const log: string[] = []
  const events: BattleEvent[] = []
  const struck = strikeOnce(moved, units, state.tiles, state.playerBaseHp, state.enemyBaseHp, state.turn, log, events)
  const result = judge(
    {
      ...state,
      playerBaseHp: struck.playerBaseHp,
      enemyBaseHp: struck.enemyBaseHp,
      units: struck.units,
    },
    log,
    events,
  )
  return {
    ...state,
    result,
    playerBaseHp: struck.playerBaseHp,
    enemyBaseHp: struck.enemyBaseHp,
    units: struck.units,
    queue: result === 'ongoing' ? queue : [],
    routes: [{ uid: moved.uid, path }],
    strike: struck.strike,
    log,
    history: [...state.history, ...events],
  }
}

/**
 * 一击打掉多少血。物理吃重甲和破甲，法术吃魔甲和法术穿透。
 *
 * @param attacker 攻击方卡牌
 * @param defender 防守方卡牌
 * @returns 实际伤害，最低为 0
 */
export function strikeDamage(attacker: UnitCardData, defender: UnitCardData): number {
  return explainStrike(attacker, defender).damage
}

/**
 * 把一击拆开，给日志里的伤害浮层用。
 * 实际伤害 = 基础攻击 + 额外攻击 - 减免。减免是护甲减去穿透后剩下的部分。
 *
 * @param attacker 攻击方卡牌
 * @param defender 防守方卡牌
 * @returns 各项来源和最终伤害
 */
export function explainStrike(attacker: UnitCardData, defender: UnitCardData): DamageDetail {
  const spell = attacker.attackKind === 'spell'
  const armor = armorValue(defender, spell ? 'ward' : 'plate')
  const pierce = armorValue(attacker, spell ? 'spellPierce' : 'pierce')
  const reduced = Math.max(0, armor - pierce)
  return {
    kind: attacker.attackKind,
    baseAtk: attacker.atk,
    extraAtk: 0,
    armor,
    pierce,
    reduced,
    damage: Math.max(0, attacker.atk - reduced),
  }
}

/**
 * 回合开始时给手里的牌减 1 点冷却，已经是 0 的不再往下减。
 *
 * @param hand 当前手牌
 * @returns 减过冷却的手牌
 */
function tickHand(hand: readonly HandCard[]): HandCard[] {
  return hand.map((card) => ({ ...card, cd: Math.max(0, card.cd - 1) }))
}

/**
 * 从牌库顶抽一张进手。牌库空了就什么都不做。
 *
 * @param hand 当前手牌
 * @param deck 剩余牌库
 * @param who 日志里的称呼
 * @param log 本回合日志
 * @returns 抽完后的手牌和牌库
 */
function drawCard(
  hand: readonly HandCard[],
  deck: readonly HandCard[],
  side: Side,
  turn: number,
  log: string[],
  events: BattleEvent[],
): { hand: HandCard[]; deck: HandCard[] } {
  if (deck.length === 0) return { hand: [...hand], deck: [] }
  const [next, ...rest] = deck
  const who = side === 'player' ? '我方' : '黄巾'
  log.push(`${who}抽到 ${next.card.name}`)
  events.push({ turn, kind: 'draw', actor: { side, card: next.card, uid: next.uid } })
  return { hand: [...hand, next], deck: rest }
}

/**
 * 把冷却为 0 的手牌召唤到大本营相邻的空地。没有空位就留在手里。
 *
 * @param side 哪一方
 * @param hand 这一方的手牌
 * @param units 场上已有的兵
 * @param tiles 棋盘
 * @param turn 正在打的回合
 * @param log 本回合文字
 * @param events 累计战报
 * @param nextUid 下一个实例编号
 * @returns 召唤后的手牌、场上的兵和下一个编号
 */
function summonSide(
  side: Side,
  hand: readonly HandCard[],
  units: readonly BoardUnit[],
  tiles: TileKind[][],
  turn: number,
  log: string[],
  events: BattleEvent[],
  nextUid: number,
): { hand: HandCard[]; units: BoardUnit[]; nextUid: number } {
  const who = side === 'player' ? '我方' : '黄巾'
  const stay: HandCard[] = []
  const ready: HandCard[] = []
  for (const card of hand) {
    if (card.cd > 0) stay.push(card)
    else ready.push(card)
  }
  const occupied = new Set(units.map(keyOf))
  const slots = openSummonTiles(side, tiles, occupied)
  const spawned = [...units]
  for (const card of ready) {
    const slot = slots.shift()
    if (!slot) {
      log.push(`${card.card.name} 没有空位，无法召唤`)
      events.push({ turn, kind: 'nospace', actor: { side, card: card.card, uid: card.uid } })
      stay.push(card)
      continue
    }
    const uid = `u${nextUid}`
    nextUid += 1
    occupied.add(keyOf(slot))
    spawned.push({ uid, side, card: card.card, row: slot.row, col: slot.col, hp: card.card.hp, entered: nextUid })
    log.push(`${who}召唤 ${card.card.name}`)
    events.push({ turn, kind: 'summon', actor: { side, card: card.card, uid, hp: card.card.hp } })
  }
  return { hand: stay, units: spawned, nextUid }
}

/**
 * 谁先行动。速度高的在前；速度相同则上场早的在前；同一批上场时我方在前。
 *
 * @param left 一名兵
 * @param right 另一名兵
 * @returns 小于 0 时 left 先动
 */
export function actingOrder(left: BoardUnit, right: BoardUnit): number {
  if (left.card.speed !== right.card.speed) return right.card.speed - left.card.speed
  if (left.entered !== right.entered) return left.entered - right.entered
  if (left.side !== right.side) return left.side === 'player' ? -1 : 1
  return left.uid.localeCompare(right.uid)
}

/**
 * 这一名兵攻击。范围内有敌兵就打，有警戒时优先打更靠后的，否则打最近的。打不到兵时，打得到大本营就打大本营。伤害马上扣掉。
 *
 * @param actor 已经走到落点的攻击者
 * @param units 场上的兵，包含攻击者
 * @param tiles 棋盘
 * @param playerBaseHp 我方大本营当前生命
 * @param enemyBaseHp 敌方大本营当前生命
 * @param turn 正在打的回合
 * @param log 这一步的文字
 * @param events 这一步的战报
 * @returns 扣血之后的兵和大本营生命
 */
function strikeOnce(
  actor: BoardUnit,
  units: readonly BoardUnit[],
  tiles: TileKind[][],
  playerBaseHp: number,
  enemyBaseHp: number,
  turn: number,
  log: string[],
  events: BattleEvent[],
): { units: BoardUnit[]; playerBaseHp: number; enemyBaseHp: number; strike: BattleStrike | null } {
  const target = pickTarget(actor, units, tiles)
  if (target) {
    const detail = explainStrike(actor.card, target.card)
    const left = Math.max(0, target.hp - detail.damage)
    log.push(`${actor.card.name} 对 ${target.card.name} 造成 ${detail.damage}`)
    events.push({
      turn,
      kind: 'hit',
      attacker: { side: actor.side, card: actor.card, uid: actor.uid, hp: actor.hp },
      target: { side: target.side, card: target.card, uid: target.uid, hp: target.hp },
      detail,
    })
    if (left <= 0) {
      log.push(`${target.card.name} 被击破`)
      events.push({ turn, kind: 'death', actor: { side: target.side, card: target.card, uid: target.uid, hp: 0 } })
    }
    return {
      playerBaseHp,
      enemyBaseHp,
      strike: {
        attackerUid: actor.uid,
        from: { row: actor.row, col: actor.col },
        to: { row: target.row, col: target.col },
        targetUid: target.uid,
        kind: 'damage',
        amount: detail.damage,
      },
      units: units.flatMap((unit) => {
        if (unit.uid === target.uid) return left > 0 ? [{ ...unit, hp: left }] : []
        return [{ ...unit }]
      }),
    }
  }
  const enemySide: Side = actor.side === 'player' ? 'enemy' : 'player'
  const baseKind = enemySide === 'player' ? 'playerBase' : 'enemyBase'
  const inRange = cellsOf(tiles, baseKind).some((cell) => manhattan(actor, cell) <= actor.card.range)
  if (!inRange) return { playerBaseHp, enemyBaseHp, strike: null, units: units.map((unit) => ({ ...unit })) }
  const damage = actor.card.atk
  const nextPlayer = enemySide === 'player' ? Math.max(0, playerBaseHp - damage) : playerBaseHp
  const nextEnemy = enemySide === 'enemy' ? Math.max(0, enemyBaseHp - damage) : enemyBaseHp
  const baseCells = cellsOf(tiles, baseKind)
  const to = baseCells.reduce((best, cell) => (manhattan(actor, cell) < manhattan(actor, best) ? cell : best))
  log.push(`${actor.card.name} 对${enemySide === 'enemy' ? '黄巾' : '我方'}大本营造成 ${damage}`)
  events.push({
    turn,
    kind: 'base',
    attacker: { side: actor.side, card: actor.card, uid: actor.uid, hp: actor.hp },
    base: enemySide,
    damage,
  })
  return {
    playerBaseHp: nextPlayer,
    enemyBaseHp: nextEnemy,
    strike: { attackerUid: actor.uid, from: { row: actor.row, col: actor.col }, to, kind: 'damage', amount: damage },
    units: units.map((unit) => ({ ...unit })),
  }
}

/**
 * 攻击范围内的敌兵。有警戒时优先打更靠后的，否则打最近的，同样近时先打血少的。
 *
 * @param unit 攻击者
 * @param units 场上所有兵
 * @param tiles 棋盘，用来判断谁更靠近自己的大本营
 * @returns 要打的敌兵。范围内没有时为 undefined
 */
function pickTarget(unit: BoardUnit, units: readonly BoardUnit[], tiles: TileKind[][]): BoardUnit | undefined {
  const foes = units.filter((other) => other.side !== unit.side && manhattan(unit, other) <= unit.card.range)
  const vigilant = hasVigilance(unit.card)
  foes.sort((left, right) => {
    if (vigilant) {
      const rear = rearRank(left, tiles) - rearRank(right, tiles)
      if (rear !== 0) return rear
    }
    return manhattan(unit, left) - manhattan(unit, right) || left.hp - right.hp || left.uid.localeCompare(right.uid)
  })
  return foes[0]
}

/**
 * 行动开始前的治疗。给生命最低、且没满血的友方回复，自己也算友方。
 * 没有可回复的目标时这一步不打出数字。
 *
 * @param state 治疗发生前的局面
 * @param queue 去掉这一步之后还没行动的队列
 * @param uid 施放治疗的兵
 * @returns 回复之后的局面。这一步不移动
 */
function healBeforeAction(state: BattleState, queue: string[], uid: string): BattleState {
  const units = state.units.map((unit) => ({ ...unit }))
  const actor = units.find((unit) => unit.uid === uid)
  if (!actor) return { ...state, queue, routes: [], strike: null, log: [] }
  const amount = healAmount(actor.card)
  const allies = units.filter((unit) => unit.side === actor.side && unit.hp < unit.card.hp)
  allies.sort((left, right) => left.hp - right.hp || left.uid.localeCompare(right.uid))
  const target = allies[0]
  const here = { row: actor.row, col: actor.col }
  if (!target || amount <= 0) return { ...state, queue, routes: [{ uid, path: [here] }], strike: null, log: [] }
  const gain = Math.min(amount, target.card.hp - target.hp)
  const healed = units.map((unit) => (unit.uid === target.uid ? { ...unit, hp: unit.hp + gain } : unit))
  const log = [`${actor.card.name} 为 ${target.card.name} 回复 ${gain}`]
  const events: BattleEvent[] = [
    {
      turn: state.turn,
      kind: 'heal',
      actor: { side: actor.side, card: actor.card, uid: actor.uid, hp: actor.hp },
      target: { side: target.side, card: target.card, uid: target.uid, hp: target.hp },
      amount: gain,
    },
  ]
  return {
    ...state,
    units: healed,
    queue,
    routes: [{ uid, path: [here] }],
    strike: {
      attackerUid: actor.uid,
      from: here,
      to: { row: target.row, col: target.col },
      targetUid: target.uid,
      kind: 'heal',
      amount: gain,
    },
    log,
    history: [...state.history, ...events],
  }
}

/**
 * 治疗技能的回复量。没有治疗时是 0。
 *
 * @param card 要检查的卡
 * @returns 回复点数合计
 */
function healAmount(card: UnitCardData): number {
  return card.skills.reduce((sum, skill) => sum + (skill.kind === 'heal' ? (skill.value ?? 0) : 0), 0)
}

/**
 * 这张卡有没有警戒。
 *
 * @param card 要检查的卡
 * @returns 有警戒时为 true
 */
function hasVigilance(card: UnitCardData): boolean {
  return card.skills.some((skill) => skill.kind === 'vigilance')
}

/**
 * 队列这一格对应的兵还在场上。治疗步看前缀后面的 uid。
 *
 * @param token 行动队列里的一格
 * @param units 场上的兵
 * @returns 还能行动时为 true
 */
function tokenAlive(token: string, units: readonly BoardUnit[]): boolean {
  const uid = token.startsWith(HEAL_QUEUE_PREFIX)
    ? token.slice(HEAL_QUEUE_PREFIX.length)
    : token.startsWith(BOLT_QUEUE_PREFIX)
      ? token.slice(BOLT_QUEUE_PREFIX.length)
      : token
  return units.some((unit) => unit.uid === uid)
}

/**
 * 这一名兵本回合要先做的步骤。治疗和雷电各占一步，最后才是移动和普攻。
 *
 * @param unit 还在场上的兵
 * @returns 行动队列里的几格
 */
function queuedSteps(unit: BoardUnit): string[] {
  const steps: string[] = []
  if (healAmount(unit.card) > 0) steps.push(`${HEAL_QUEUE_PREFIX}${unit.uid}`)
  if (lightningAmount(unit.card) > 0) steps.push(`${BOLT_QUEUE_PREFIX}${unit.uid}`)
  steps.push(unit.uid)
  return steps
}

/**
 * 撒豆成兵能召出来的单位。
 *
 * @param card 要检查的卡
 * @returns 候选单位。没有这个技能时是空数组
 */
function beanSummons(card: UnitCardData): readonly UnitCardData[] {
  return card.skills.flatMap((skill) => (skill.kind === 'bean' ? [...(skill.summons ?? [])] : []))
}

/**
 * 雷电招来的基础伤害。没有这个技能时是 0。
 *
 * @param card 要检查的卡
 * @returns 法术伤害基础值
 */
function lightningAmount(card: UnitCardData): number {
  return card.skills.reduce((sum, skill) => sum + (skill.kind === 'lightning' ? (skill.value ?? 0) : 0), 0)
}

/**
 * 从一组候选里随机取一个。
 *
 * @param items 至少一个候选
 * @param random 返回 0 到 1
 * @returns 抽中的那一个
 */
function pickOne<T>(items: readonly T[], random: () => number): T {
  const index = Math.min(items.length - 1, Math.floor(random() * items.length))
  return items[index]
}

/**
 * 回合开始时，每个会撒豆成兵的单位在周围召一只黄巾兵。没有空位就跳过。
 *
 * @param units 手牌召唤结束后的场上单位
 * @param tiles 棋盘
 * @param turn 正在开始的回合
 * @param log 本回合文字
 * @param events 累计战报
 * @param nextUid 下一个实例编号
 * @param random 返回 0 到 1，用来决定兵种和落点
 * @returns 召完后的兵和下一个编号
 */
function scatterBeans(
  units: readonly BoardUnit[],
  tiles: TileKind[][],
  turn: number,
  log: string[],
  events: BattleEvent[],
  nextUid: number,
  random: () => number,
): { units: BoardUnit[]; nextUid: number } {
  const casters = units.filter((unit) => beanSummons(unit.card).length > 0).sort(actingOrder)
  let spawned = units.map((unit) => ({ ...unit }))
  for (const caster of casters) {
    const options = beanSummons(caster.card)
    const card = pickOne(options, random)
    const occupied = new Set(spawned.map(keyOf))
    const spots = openAround(caster, tiles, occupied)
    if (spots.length === 0) {
      log.push(`${caster.card.name} 周围没有空位，无法召唤`)
      events.push({ turn, kind: 'nospace', actor: { side: caster.side, card: caster.card, uid: caster.uid, hp: caster.hp } })
      continue
    }
    const spot = pickOne(spots, random)
    const uid = `u${nextUid}`
    nextUid += 1
    spawned.push({ uid, side: caster.side, card, row: spot.row, col: spot.col, hp: card.hp, entered: nextUid })
    log.push(`${caster.card.name} 召唤 ${card.name}`)
    events.push({ turn, kind: 'summon', actor: { side: caster.side, card, uid, hp: card.hp } })
  }
  return { units: spawned, nextUid }
}

/**
 * 雷电招来。对随机一个敌方单位造成法术伤害，魔甲会减伤。没有敌人时这一步不打出数字。
 *
 * @param state 打雷前的局面
 * @param queue 去掉这一步之后还没行动的队列
 * @param uid 施放雷电的兵
 * @returns 扣血之后的局面。这一步不移动
 */
function lightningAction(state: BattleState, queue: string[], uid: string): BattleState {
  const units = state.units.map((unit) => ({ ...unit }))
  const actor = units.find((unit) => unit.uid === uid)
  if (!actor) return { ...state, queue, routes: [], strike: null, log: [] }
  const here = { row: actor.row, col: actor.col }
  const amount = lightningAmount(actor.card)
  const foes = units.filter((unit) => unit.side !== actor.side)
  if (foes.length === 0 || amount <= 0) {
    const log: string[] = []
    const events: BattleEvent[] = []
    const result = judge(state, log, events)
    return {
      ...state,
      result,
      queue: result === 'ongoing' ? queue : [],
      routes: [{ uid, path: [here] }],
      strike: null,
      log,
      history: events.length > 0 ? [...state.history, ...events] : state.history,
    }
  }
  const target = pickOne(foes, state.random ?? Math.random)
  const armor = armorValue(target.card, 'ward')
  const pierce = armorValue(actor.card, 'spellPierce')
  const reduced = Math.max(0, armor - pierce)
  const damage = Math.max(0, amount - reduced)
  const left = Math.max(0, target.hp - damage)
  const detail: DamageDetail = { kind: 'spell', baseAtk: amount, extraAtk: 0, armor, pierce, reduced, damage }
  const log = [`${actor.card.name} 对 ${target.card.name} 造成 ${damage}`]
  const events: BattleEvent[] = [
    {
      turn: state.turn,
      kind: 'hit',
      attacker: { side: actor.side, card: actor.card, uid: actor.uid, hp: actor.hp },
      target: { side: target.side, card: target.card, uid: target.uid, hp: target.hp },
      detail,
    },
  ]
  if (left <= 0) {
    log.push(`${target.card.name} 被击破`)
    events.push({ turn: state.turn, kind: 'death', actor: { side: target.side, card: target.card, uid: target.uid, hp: 0 } })
  }
  const nextUnits = units.flatMap((unit) => {
    if (unit.uid !== target.uid) return [unit]
    return left > 0 ? [{ ...unit, hp: left }] : []
  })
  const result = judge({ ...state, units: nextUnits }, log, events)
  return {
    ...state,
    result,
    units: nextUnits,
    queue: result === 'ongoing' ? queue : [],
    routes: [{ uid, path: [here] }],
    strike: {
      attackerUid: actor.uid,
      from: here,
      to: { row: target.row, col: target.col },
      targetUid: target.uid,
      kind: 'damage',
      amount: damage,
    },
    log,
    history: [...state.history, ...events],
  }
}

/**
 * 这一步要靠近的格子。普通兵朝敌方大本营走；有警戒且场上有敌人时，朝更靠后的那名敌人走。
 *
 * @param actor 正在行动的兵
 * @param units 场上的兵
 * @param tiles 棋盘
 * @returns 寻路目标
 */
function routeGoals(actor: BoardUnit, units: readonly BoardUnit[], tiles: TileKind[][]): Coord[] {
  const baseKind = actor.side === 'player' ? 'enemyBase' : 'playerBase'
  if (!hasVigilance(actor.card)) return cellsOf(tiles, baseKind)
  const foes = units.filter((unit) => unit.side !== actor.side)
  if (foes.length === 0) return cellsOf(tiles, baseKind)
  const rear = [...foes].sort((left, right) => rearRank(left, tiles) - rearRank(right, tiles) || left.uid.localeCompare(right.uid))[0]
  return [{ row: rear.row, col: rear.col }]
}

/**
 * 离自己大本营有多近。越小越靠后。
 *
 * @param unit 要比较的兵
 * @param tiles 棋盘
 * @returns 到本方大本营的最短曼哈顿距离
 */
function rearRank(unit: BoardUnit, tiles: TileKind[][]): number {
  const kind = unit.side === 'player' ? 'playerBase' : 'enemyBase'
  const bases = cellsOf(tiles, kind)
  if (bases.length === 0) return unit.row
  return Math.min(...bases.map((cell) => manhattan(unit, cell)))
}

/**
 * 看大本营还有没有血，或者是不是打满了回合。
 * 一方手牌、牌库和场上的卡都没有时，也直接判负并结算。
 *
 * @param state 这一步之后的局面
 * @param log 本回合文字
 * @param events 累计战报
 * @returns 胜负
 */
function judge(state: BattleState, log: string[], events: BattleEvent[]): BattleResult {
  const finish = (text: string, result: BattleResult) => {
    log.push(text)
    events.push({ turn: state.turn, kind: 'end', text })
    return result
  }
  if (state.enemyBaseHp <= 0 && state.playerBaseHp <= 0) return finish('双方大本营同时被击破', 'draw')
  if (state.enemyBaseHp <= 0) return finish('黄巾大本营被击破', 'win')
  if (state.playerBaseHp <= 0) return finish('我方大本营被击破', 'lose')
  const playerOut = sideOut(state, 'player')
  const enemyOut = sideOut(state, 'enemy')
  if (playerOut && enemyOut) return finish('双方都没有可战斗的卡牌', 'draw')
  if (enemyOut) return finish('黄巾没有可战斗的卡牌', 'win')
  if (playerOut) return finish('我方没有可战斗的卡牌', 'lose')
  if (state.turn >= MAX_TURNS) return finish('打满回合，未能分出胜负', 'draw')
  return 'ongoing'
}

/**
 * 这一方是不是已经没有手牌、牌库和场上的卡。
 *
 * @param state 当前局面
 * @param side 我方或黄巾
 * @returns 三处都空时为 true
 */
function sideOut(state: BattleState, side: Side): boolean {
  const hand = side === 'player' ? state.playerHand : state.enemyHand
  const deck = side === 'player' ? state.playerDeck : state.enemyDeck
  return hand.length === 0 && deck.length === 0 && !state.units.some((unit) => unit.side === side)
}

/**
 * 一张卡身上某种护甲或穿透的点数。
 *
 * @param card 卡牌
 * @param kind 破甲、法术穿透、重甲或魔甲
 * @returns 点数合计
 */
function armorValue(card: UnitCardData, kind: ArmorSkillKind): number {
  return card.skills.reduce((sum, skill) => sum + (skill.kind === kind ? (skill.value ?? 0) : 0), 0)
}

