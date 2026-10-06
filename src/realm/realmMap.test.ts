import { describe, expect, it } from 'vitest'
import { BOARD_SIZE, openSummonTiles } from './board'
import { buildRealmMap, classicRealmTiles, hasOpenGroundRoutes } from './realmMap'

/** 固定种子的随机数，用来重复生成同一张图 */
function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

/**
 * 把棋盘收成字符串，方便比较两张图是否一样。
 *
 * @param tiles 棋盘
 * @returns 每行拼在一起的地形
 */
function signature(tiles: readonly (readonly string[])[]): string {
  return tiles.map((row) => row.join(',')).join('|')
}

describe('秘境地图', () => {
  it('仍是 10x10，大本营留在对角，营口是空地', () => {
    const tiles = buildRealmMap(seededRandom(3))
    expect(tiles).toHaveLength(BOARD_SIZE)
    expect(tiles.every((row) => row.length === BOARD_SIZE)).toBe(true)
    expect(tiles[8][0]).toBe('playerBase')
    expect(tiles[9][1]).toBe('playerBase')
    expect(tiles[0][8]).toBe('enemyBase')
    expect(tiles[1][9]).toBe('enemyBase')
    expect(openSummonTiles('player', tiles, new Set()).length).toBeGreaterThan(0)
    expect(openSummonTiles('enemy', tiles, new Set()).length).toBeGreaterThan(0)
  })

  it('地面至少有两条互不重叠的路，全是河流时也会挖开', () => {
    expect(hasOpenGroundRoutes(classicRealmTiles())).toBe(true)
    expect(hasOpenGroundRoutes(buildRealmMap(() => 0))).toBe(true)
    for (let seed = 1; seed <= 40; seed += 1) {
      expect(hasOpenGroundRoutes(buildRealmMap(seededRandom(seed)))).toBe(true)
    }
  })

  it('同一随机数得到同一张图，不同种子不会张张相同', () => {
    const first = signature(buildRealmMap(seededRandom(5)))
    const again = signature(buildRealmMap(seededRandom(5)))
    const other = signature(buildRealmMap(seededRandom(9)))
    expect(again).toBe(first)
    expect(other).not.toBe(first)
  })
})
