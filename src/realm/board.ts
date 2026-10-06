/** 棋盘边长。黄巾之乱用 10 格见方 */
export const BOARD_SIZE = 10

/** 格子种类。森林能走，石头和河流不能进，大本营不能站人 */
export type TileKind = 'empty' | 'forest' | 'river' | 'stone' | 'playerBase' | 'enemyBase'

/** 棋盘坐标。行 0 在上方，是敌方一侧 */
export interface Coord {
  row: number
  col: number
}

/** 上下左右。召唤、移动和攻击范围都按这四个方向计步 */
const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const

/**
 * 把地图字符串收成格子。字符：. 空地，F 森林，R 河流，S 石头，E 敌方大本营，P 我方大本营。
 *
 * @param rows 每行一个长度为 10 的字符串
 * @returns 按行存放的格子
 */
export function parseMap(rows: readonly string[]): TileKind[][] {
  const glyph: Record<string, TileKind> = {
    '.': 'empty',
    F: 'forest',
    R: 'river',
    S: 'stone',
    E: 'enemyBase',
    P: 'playerBase',
  }
  if (rows.length !== BOARD_SIZE) throw new Error('棋盘必须是 10 行')
  return rows.map((row) => {
    if (row.length !== BOARD_SIZE) throw new Error('棋盘必须是 10 列')
    return [...row].map((char) => {
      const tile = glyph[char]
      if (!tile) throw new Error(`未知格子 ${char}`)
      return tile
    })
  })
}

/**
 * 坐标收成占用表的键。
 *
 * @param coord 格子
 * @returns 行和列拼成的键
 */
export function keyOf(coord: Coord): string {
  return `${coord.row},${coord.col}`
}

/**
 * 上下左右的步数。
 *
 * @param from 起点
 * @param to 终点
 * @returns 曼哈顿距离
 */
export function manhattan(from: Coord, to: Coord): number {
  return Math.abs(from.row - to.row) + Math.abs(from.col - to.col)
}

/**
 * 找出某一侧大本营占的格子。
 *
 * @param tiles 棋盘
 * @param kind 我方或敌方大本营
 * @returns 大本营格子
 */
export function cellsOf(tiles: readonly (readonly TileKind[])[], kind: 'playerBase' | 'enemyBase'): Coord[] {
  const cells: Coord[] = []
  tiles.forEach((row, rowIndex) => {
    row.forEach((tile, col) => {
      if (tile === kind) cells.push({ row: rowIndex, col })
    })
  })
  return cells
}

/**
 * 大本营外侧、可以召唤的空地。已有兵或不是空地的格子不算。
 * 靠近敌方大本营的格子排在前面。
 *
 * @param side 要召唤的一侧
 * @param tiles 棋盘
 * @param occupied 已经被兵站住的坐标键
 * @returns 按优先级排好的召唤格
 */
export function openSummonTiles(
  side: 'player' | 'enemy',
  tiles: readonly (readonly TileKind[])[],
  occupied: ReadonlySet<string>,
): Coord[] {
  const own = cellsOf(tiles, side === 'player' ? 'playerBase' : 'enemyBase')
  const goal = cellsOf(tiles, side === 'player' ? 'enemyBase' : 'playerBase')
  const ownKeys = new Set(own.map(keyOf))
  const seen = new Set<string>()
  const found: Coord[] = []
  for (const cell of own) {
    for (const next of orthogonal(cell)) {
      const key = keyOf(next)
      if (seen.has(key) || ownKeys.has(key)) continue
      seen.add(key)
      if (tiles[next.row][next.col] !== 'empty' || occupied.has(key)) continue
      found.push(next)
    }
  }
  found.sort((left, right) => distanceTo(left, goal) - distanceTo(right, goal) || left.row - right.row || left.col - right.col)
  return found
}

/**
 * 一名兵上下左右能走进去、且没被占住的格子。撒豆成兵用这个找落点。
 *
 * @param from 施法者所在格
 * @param tiles 棋盘
 * @param occupied 已经被兵站住的坐标键
 * @returns 按上、下、左、右排的空位。没有时是空数组
 */
export function openAround(from: Coord, tiles: readonly (readonly TileKind[])[], occupied: ReadonlySet<string>): Coord[] {
  return orthogonal(from).filter((cell) => canEnter(tiles[cell.row][cell.col]) && !occupied.has(keyOf(cell)))
}

/**
 * 在移动力内走向离目标最近的格子，并记下经过的每一格。
 * 路径含起点。走不近时只有起点，方便界面按格滑动。
 *
 * @param from 当前格子
 * @param move 移动力
 * @param tiles 棋盘
 * @param blocked 其他兵占住的坐标键
 * @param goals 要靠近的格子，一般是敌人或敌方大本营
 * @param flying 为 true 时可以经过河流和石头，仍然不能进大本营
 * @param retreatBases 不能后退时传入敌方大本营。比起点离这些格子更远的格子不走
 * @returns 从起点到落点的格子，相邻两格只差一步
 */
export function chooseRoute(
  from: Coord,
  move: number,
  tiles: readonly (readonly TileKind[])[],
  blocked: ReadonlySet<string>,
  goals: readonly Coord[],
  flying = false,
  retreatBases?: readonly Coord[],
): Coord[] {
  const retreatLimit = retreatBases === undefined ? null : distanceTo(from, retreatBases)
  const parent = new Map<string, Coord | null>()
  parent.set(keyOf(from), null)
  let best = { ...from, steps: 0, score: distanceTo(from, goals) }
  const seen = new Set([keyOf(from)])
  const queue: { row: number; col: number; steps: number }[] = [{ ...from, steps: 0 }]
  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) break
    const score = distanceTo(current, goals)
    if (score < best.score || (score === best.score && current.steps < best.steps)) {
      best = { row: current.row, col: current.col, steps: current.steps, score }
    }
    if (current.steps >= move) continue
    for (const next of orthogonal(current)) {
      const key = keyOf(next)
      if (seen.has(key) || blocked.has(key) || !canEnter(tiles[next.row][next.col], flying)) continue
      if (retreatLimit !== null && retreatBases && distanceTo(next, retreatBases) > retreatLimit) continue
      seen.add(key)
      parent.set(key, { row: current.row, col: current.col })
      queue.push({ ...next, steps: current.steps + 1 })
    }
  }
  const path: Coord[] = []
  let cursor: Coord | null = { row: best.row, col: best.col }
  const walked = new Set<string>()
  while (cursor && !walked.has(keyOf(cursor))) {
    path.push(cursor)
    walked.add(keyOf(cursor))
    cursor = parent.get(keyOf(cursor)) ?? null
  }
  path.reverse()
  return path
}

/**
 * 在移动力内走向离目标最近的格子。走不近就留在原地。
 *
 * @param from 当前格子
 * @param move 移动力
 * @param tiles 棋盘
 * @param blocked 其他兵占住的坐标键
 * @param goals 要靠近的格子，一般是敌方大本营
 * @param flying 为 true 时可以经过河流和石头，仍然不能进大本营
 * @returns 这一回合要站的格子
 */
export function chooseDestination(
  from: Coord,
  move: number,
  tiles: readonly (readonly TileKind[])[],
  blocked: ReadonlySet<string>,
  goals: readonly Coord[],
  flying = false,
): Coord {
  const path = chooseRoute(from, move, tiles, blocked, goals, flying)
  return path[path.length - 1]
}

/**
 * 到一组目标的最近距离。
 *
 * @param from 起点
 * @param goals 目标格子
 * @returns 最近的曼哈顿距离。没有目标时为一个很大的数
 */
function distanceTo(from: Coord, goals: readonly Coord[]): number {
  if (goals.length === 0) return BOARD_SIZE * BOARD_SIZE
  return Math.min(...goals.map((goal) => manhattan(from, goal)))
}

/**
 * 上下左右且仍在棋盘内的相邻格。
 *
 * @param coord 起点
 * @returns 相邻格
 */
function orthogonal(coord: Coord): Coord[] {
  return DIRS.flatMap(([rowStep, colStep]) => {
    const next = { row: coord.row + rowStep, col: coord.col + colStep }
    return next.row >= 0 && next.col >= 0 && next.row < BOARD_SIZE && next.col < BOARD_SIZE ? [next] : []
  })
}

/**
 * 这格能不能走进去。森林算空地，石头、河流和大本营不行。
 * 飞行单位可以落在河流和石头上，大本营仍然不能站。
 *
 * @param tile 格子种类
 * @param flying 是否无视河流和石头
 * @returns 能进入时为 true
 */
function canEnter(tile: TileKind, flying = false): boolean {
  if (tile === 'empty' || tile === 'forest') return true
  return flying && (tile === 'river' || tile === 'stone')
}
