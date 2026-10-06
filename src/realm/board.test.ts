import { describe, expect, it } from 'vitest'
import { chooseRoute, manhattan, parseMap } from './board'

/** 三面是石头、只朝南开口的凹地。直线往北会被石头卡住 */
const POCKET = parseMap([
  '..........',
  '..........',
  '..........',
  '....SSS...',
  '....S.S...',
  '....S.S...',
  '..........',
  '..........',
  '..........',
  '..........',
])

describe('绕开石头', () => {
  it('直线被石头挡住时，先走出凹地，而不是停在原地或钻进死角', () => {
    const from = { row: 5, col: 5 }
    const goal = { row: 0, col: 5 }
    const step = chooseRoute(from, 1, POCKET, new Set(), [goal])
    expect(step).toEqual([from, { row: 6, col: 5 }])

    const two = chooseRoute(from, 2, POCKET, new Set(), [goal])
    expect(two[0]).toEqual(from)
    expect(two[1]).toEqual({ row: 6, col: 5 })
    expect(two).toHaveLength(3)
    expect(two.some((cell) => POCKET[cell.row][cell.col] === 'stone')).toBe(false)

    let at = from
    for (let turn = 0; turn < 20 && manhattan(at, goal) > 0; turn += 1) {
      const path = chooseRoute(at, 1, POCKET, new Set(), [goal])
      expect(path.length).toBeGreaterThan(1)
      at = path[path.length - 1]
      expect(POCKET[at.row][at.col]).not.toBe('stone')
    }
    expect(at).toEqual(goal)
  })
})
