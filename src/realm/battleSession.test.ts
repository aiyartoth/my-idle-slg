import { describe, expect, it } from 'vitest'
import { BATTLE_LEAVE_MS, battleLeaveDelay } from './battleSession'

describe('战斗结束离开', () => {
  it('分出胜负后再停最多 5 秒，超时就马上走', () => {
    const endedAt = 1_000
    expect(battleLeaveDelay(endedAt, endedAt)).toBe(BATTLE_LEAVE_MS)
    expect(battleLeaveDelay(endedAt, endedAt + 2_000)).toBe(3_000)
    expect(battleLeaveDelay(endedAt, endedAt + BATTLE_LEAVE_MS)).toBe(0)
    expect(battleLeaveDelay(endedAt, endedAt + 9_000)).toBe(0)
  })
})
