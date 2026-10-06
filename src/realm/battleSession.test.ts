import { describe, expect, it } from 'vitest'
import { INFANTRY_CARD } from '../data/cards'
import { DECK_LIMIT, DECK_OVER_MESSAGE, getPlayerSnapshot, restorePlayer } from '../data/player'
import { ensureRealmBattle, getSession, realmEntryPath, type BattleSession } from './battleSession'

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

  it('卡组超过上限时不开秘境，并给出下阵提示', () => {
    const before = getPlayerSnapshot()
    restorePlayer({
      gold: before.gold,
      level: before.level,
      exp: before.exp,
      deckSeq: 200,
      bagSeq: 200,
      deck: Array.from({ length: DECK_LIMIT + 1 }, (_, index) => ({ uid: `d-realm-${index}`, card: INFANTRY_CARD })),
      bag: [...before.bag],
      crystal: before.crystal,
      furnaceOffers: [...before.furnaceOffers],
      realms: before.realms,
      activityLog: [...before.activityLog],
    })
    expect(ensureRealmBattle('yellow-turban')).toEqual([DECK_OVER_MESSAGE])
    expect(getSession().status).toBe('idle')
    expect(getPlayerSnapshot().deck).toHaveLength(DECK_LIMIT + 1)
  })
})
