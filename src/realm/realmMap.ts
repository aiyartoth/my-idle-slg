import { BOARD_SIZE, parseMap, type Coord, type TileKind } from './board'

/** 非营口格子掷成河流的概率。河流不能走，掷完再往下分石头和森林 */
const RIVER_ROLL = 0.12

/** 掷成石头的概率。石头和河流一样挡住地面单位 */
const STONE_ROLL = 0.1

/** 掷成森林的概率。森林能走，只换地形，不参与堵路 */
const FOREST_ROLL = 0.18

/** 我方大本营。左下角 2x2，和原来的固定棋盘一样 */
const PLAYER_BASE: readonly Coord[] = [
  { row: 8, col: 0 },
  { row: 8, col: 1 },
  { row: 9, col: 0 },
  { row: 9, col: 1 },
]

/** 敌方大本营。右上角 2x2 */
const ENEMY_BASE: readonly Coord[] = [
  { row: 0, col: 8 },
  { row: 0, col: 9 },
  { row: 1, col: 8 },
  { row: 1, col: 9 },
]

/**
 * 堵死时强制挖开的两条路。只在随机地形把地面切断后使用。
 * 上一路从我方营口 (7,1) 接到敌方营口 (2,8)，下一路从 (8,2) 接到同一个营口。
 * 中间格子不重叠，所以挖开之后不会只剩一个路口。
 */
const FALLBACK_LANES: readonly (readonly Coord[])[] = [
  [
    { row: 7, col: 1 },
    { row: 7, col: 2 },
    { row: 7, col: 3 },
    { row: 6, col: 3 },
    { row: 6, col: 4 },
    { row: 5, col: 4 },
    { row: 5, col: 5 },
    { row: 4, col: 5 },
    { row: 4, col: 6 },
    { row: 3, col: 6 },
    { row: 3, col: 7 },
    { row: 2, col: 7 },
    { row: 2, col: 8 },
  ],
  [
    { row: 8, col: 2 },
    { row: 8, col: 3 },
    { row: 8, col: 4 },
    { row: 7, col: 4 },
    { row: 7, col: 5 },
    { row: 6, col: 5 },
    { row: 6, col: 6 },
    { row: 5, col: 6 },
    { row: 5, col: 7 },
    { row: 4, col: 7 },
    { row: 4, col: 8 },
    { row: 3, col: 8 },
    { row: 2, col: 8 },
  ],
]

/** 上下左右。寻路和营口都按这四个方向 */
const DIRS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const

/**
 * 黄巾之乱的棋盘。右上角 EE 是敌方 2x2 大本营，左下角 PP 是我方。
 * 中间有森林、河流和石头，中间四列留出通路。
 * 技能测试仍用这张固定图。正式开战改走 buildRealmMap。
 */
export const CLASSIC_REALM_ROWS = [
  '........EE',
  '........EE',
  '..........',
  '.FF....S..',
  'RRR....RRR',
  '..SF..FS..',
  '.F......S.',
  '..........',
  'PP........',
  'PP........',
]

/**
 * 技能测试用的固定棋盘。每次返回新数组，测试改格子不会串到下一场。
 *
 * @returns 经典 10x10 地形
 */
export function classicRealmTiles(): TileKind[][] {
  return parseMap(CLASSIC_REALM_ROWS)
}

/**
 * 生成本场秘境的棋盘。尺寸固定 10x10，大本营仍在对角。
 * 其余格子随机放森林、河流和石头。地面从我方营口到敌方营口至少留两条互不重叠的路，避免路口被一格堵死。
 * 营口保持空地，召唤才站得上去。
 *
 * @param random 返回 0 到 1。同一串随机数得到同一张图
 * @returns 本场战斗的格子
 */
export function buildRealmMap(random: () => number = Math.random): TileKind[][] {
  const tiles = emptyBoard()
  paintBases(tiles)
  const reserved = new Set<string>([...PLAYER_BASE, ...ENEMY_BASE, ...mouthCells(PLAYER_BASE), ...mouthCells(ENEMY_BASE)].map(keyOf))
  for (let row = 0; row < BOARD_SIZE; row += 1) {
    for (let col = 0; col < BOARD_SIZE; col += 1) {
      if (reserved.has(keyOf({ row, col }))) continue
      const roll = random()
      if (roll < RIVER_ROLL) tiles[row][col] = 'river'
      else if (roll < RIVER_ROLL + STONE_ROLL) tiles[row][col] = 'stone'
      else if (roll < RIVER_ROLL + STONE_ROLL + FOREST_ROLL) tiles[row][col] = 'forest'
    }
  }
  if (!hasOpenGroundRoutes(tiles)) widenChoke(tiles, random)
  if (!hasOpenGroundRoutes(tiles)) clearLanes(tiles)
  return tiles
}

/**
 * 地面单位能不能从我方营口走到敌方营口，而且不是只靠一个路口。
 * 两条路除了营口之外不共用格子，所以堵上一格还有另一条能过。
 *
 * @param tiles 棋盘
 * @returns 两条路都在时为 true
 */
export function hasOpenGroundRoutes(tiles: readonly (readonly TileKind[])[]): boolean {
  const sources = mouthCells(PLAYER_BASE).filter((cell) => canWalk(tiles[cell.row][cell.col]))
  const sinks = mouthCells(ENEMY_BASE).filter((cell) => canWalk(tiles[cell.row][cell.col]))
  const sinkKeys = new Set(sinks.map(keyOf))
  const sourceKeys = new Set(sources.map(keyOf))
  const path = findPath(tiles, sources, sinkKeys, new Set())
  if (!path) return false
  const blocked = new Set(path.map(keyOf).filter((key) => !sourceKeys.has(key) && !sinkKeys.has(key)))
  const alternate = findPath(tiles, sources, sinkKeys, blocked)
  if (!alternate) return false
  const used = new Set(path.map(keyOf))
  return alternate.some((cell) => !used.has(keyOf(cell)))
}

/**
 * 空白 10x10。调用方再画大本营和地形。
 *
 * @returns 全是空地的棋盘
 */
function emptyBoard(): TileKind[][] {
  return Array.from({ length: BOARD_SIZE }, () => Array.from({ length: BOARD_SIZE }, () => 'empty' as TileKind))
}

/**
 * 把两侧大本营画上。营的位置不随机。
 *
 * @param tiles 待画的棋盘
 */
function paintBases(tiles: TileKind[][]): void {
  PLAYER_BASE.forEach((cell) => {
    tiles[cell.row][cell.col] = 'playerBase'
  })
  ENEMY_BASE.forEach((cell) => {
    tiles[cell.row][cell.col] = 'enemyBase'
  })
}

/**
 * 大本营外侧、能当营口的格子。不含营本身。
 *
 * @param bases 一侧大本营占的格子
 * @returns 营外相邻格
 */
function mouthCells(bases: readonly Coord[]): Coord[] {
  const inside = new Set(bases.map(keyOf))
  const seen = new Set<string>()
  const found: Coord[] = []
  for (const cell of bases) {
    for (const next of around(cell)) {
      const key = keyOf(next)
      if (inside.has(key) || seen.has(key)) continue
      seen.add(key)
      found.push(next)
    }
  }
  return found
}

/**
 * 已经有一条路、但第二条被一格堵住时，把路边的河流或石头挖开，直到第二条出现。
 *
 * @param tiles 当前棋盘。会直接改掉堵住的格子
 * @param random 决定先挖哪一格，返回 0 到 1
 * @returns 挖开之后两条路都通时为 true
 */
function widenChoke(tiles: TileKind[][], random: () => number): boolean {
  const sources = mouthCells(PLAYER_BASE)
  const sinkKeys = new Set(mouthCells(ENEMY_BASE).map(keyOf))
  const path = findPath(tiles, sources, sinkKeys, new Set())
  if (!path) return false
  const onPath = new Set(path.map(keyOf))
  const candidates: Coord[] = []
  for (const cell of path) {
    for (const next of around(cell)) {
      const key = keyOf(next)
      if (onPath.has(key)) continue
      const tile = tiles[next.row][next.col]
      if (tile !== 'river' && tile !== 'stone') continue
      candidates.push(next)
    }
  }
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.floor(random() * (index + 1)))
    const current = candidates[index]
    candidates[index] = candidates[swap]
    candidates[swap] = current
  }
  for (const cell of candidates) {
    tiles[cell.row][cell.col] = 'empty'
    if (hasOpenGroundRoutes(tiles)) return true
  }
  return false
}

/**
 * 随机地形把两侧切断时，挖开预先留的两条路。河流和石头改回空地，森林本来就能走。
 *
 * @param tiles 当前棋盘。会直接改掉路上的阻挡
 */
function clearLanes(tiles: TileKind[][]): void {
  for (const lane of FALLBACK_LANES) {
    for (const cell of lane) {
      const tile = tiles[cell.row][cell.col]
      if (tile === 'river' || tile === 'stone') tiles[cell.row][cell.col] = 'empty'
    }
  }
}

/**
 * 沿空地和森林找一条到敌方营口的路。extraBlocked 里的格子当作已经堵上。
 *
 * @param tiles 棋盘
 * @param sources 我方营口
 * @param sinkKeys 敌方营口的坐标键
 * @param extraBlocked 这条搜索不能再走的格子
 * @returns 从营口到营口的格子。走不通时为 null
 */
function findPath(
  tiles: readonly (readonly TileKind[])[],
  sources: readonly Coord[],
  sinkKeys: ReadonlySet<string>,
  extraBlocked: ReadonlySet<string>,
): Coord[] | null {
  const parent = new Map<string, Coord | null>()
  const queue: Coord[] = []
  for (const source of sources) {
    const key = keyOf(source)
    if (extraBlocked.has(key) || !canWalk(tiles[source.row][source.col])) continue
    if (parent.has(key)) continue
    parent.set(key, null)
    queue.push(source)
  }
  let found: Coord | null = null
  for (let index = 0; index < queue.length && !found; index += 1) {
    const current = queue[index]
    if (sinkKeys.has(keyOf(current))) {
      found = current
      break
    }
    for (const next of around(current)) {
      const key = keyOf(next)
      if (parent.has(key) || extraBlocked.has(key) || !canWalk(tiles[next.row][next.col])) continue
      parent.set(key, current)
      queue.push(next)
    }
  }
  if (!found) return null
  const path: Coord[] = []
  let cursor: Coord | null = found
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
 * 地面单位能不能站上这格。森林算能走，河流、石头和大本营不行。
 *
 * @param tile 格子种类
 * @returns 能走时为 true
 */
function canWalk(tile: TileKind): boolean {
  return tile === 'empty' || tile === 'forest'
}

/**
 * 仍在棋盘内的相邻格。
 *
 * @param cell 起点
 * @returns 上下左右里没出界的格子
 */
function around(cell: Coord): Coord[] {
  return DIRS.flatMap(([rowStep, colStep]) => {
    const next = { row: cell.row + rowStep, col: cell.col + colStep }
    return next.row >= 0 && next.col >= 0 && next.row < BOARD_SIZE && next.col < BOARD_SIZE ? [next] : []
  })
}

/**
 * 坐标收成键，用来做占用表。
 *
 * @param cell 格子
 * @returns 行和列拼成的键
 */
function keyOf(cell: Coord): string {
  return `${cell.row},${cell.col}`
}
