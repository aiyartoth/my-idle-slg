import { describe, expect, it } from 'vitest'
import { realmEntryPath, type BattleSession } from './battleSession'

describe('秘境入口', () => {
  it('还在打的直接回战场', () => {
    const session = { status: 'running', realmId: 'yellow-turban', battle: {} } as BattleSession
    expect(realmEntryPath(session)).toBe('/realm/yellow-turban')
  })

  it('已经分出胜负的回到列表，不再进入战斗页', () => {
    const finished = {
      status: 'unconfirmed',
      realmId: 'yellow-turban',
      battle: {},
      rewarded: true,
      loot: null,
    } as BattleSession
    expect(realmEntryPath(finished)).toBe('/realm')
    expect(realmEntryPath({ status: 'idle' })).toBe('/realm')
  })
})
