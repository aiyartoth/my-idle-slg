import { describe, expect, it } from 'vitest'
import { YELLOW_ARCHER_CARD, YELLOW_INFANTRY_CARD } from '../realm/yellowTurban'
import { ensureCardRarity, INFANTRY_CARD } from './cards'
import { playerSaveFrom } from './playerDb'
import { IDLE_CAP_MS } from './idle'
import { FURNACE_REFRESH_CRYSTAL } from './furnace'
import { ACTIVITY_LOG_LIMIT, addCardToBag, addExp, addMaterialToBag, baseHpFrom, craftFurnaceRecipe, decomposeBagCard, ensureFurnaceOffers, expToNextLevel, formatActivityLine, getPlayerSnapshot, HP_PER_LEVEL, isIdling, noteBattleResult, notePresence, recordRealmClear, refreshFurnaceOffers, restorePlayer, settleOfflineReturn, shouldOfferIdle, startClearedIdle, toggleRealmIdle, unequipDeckCard, useBagCard } from './player'

describe('冒险者', () => {
  it('大本营生命按等级加点，科技和神器以后再加', () => {
    expect(HP_PER_LEVEL).toBe(10)
    expect(baseHpFrom(1)).toBe(10)
    expect(baseHpFrom(2, 3, 4)).toBe(27)
  })

  it('使用背包里的卡牌后，卡组多一张，背包少一件', () => {
    const before = getPlayerSnapshot()
    const item = addCardToBag(YELLOW_ARCHER_CARD)
    expect(getPlayerSnapshot().bag.map((entry) => entry.id)).toContain(item.id)
    expect(useBagCard(item.id)).toBe(true)
    const after = getPlayerSnapshot()
    expect(after.bag.some((entry) => entry.id === item.id)).toBe(false)
    expect(after.deck).toHaveLength(before.deck.length + 1)
    expect(after.deck[after.deck.length - 1]?.card.name).toBe('黄巾弓箭手')
  })

  it('卡组里的牌可以下阵回背包', () => {
    const entry = getPlayerSnapshot().deck[0]
    if (!entry) throw new Error('缺卡')
    const beforeBag = getPlayerSnapshot().bag.length
    expect(unequipDeckCard(entry.uid)).toBe(true)
    const after = getPlayerSnapshot()
    expect(after.deck.some((item) => item.uid === entry.uid)).toBe(false)
    expect(after.bag).toHaveLength(beforeBag + 1)
    const returned = after.bag.at(-1)
    expect(returned?.kind).toBe('card')
    if (returned?.kind === 'card') expect(returned.card.name).toBe(entry.card.name)
  })

  it('同名牌都叠在一起，下阵也叠回这一叠', () => {
    const first = addCardToBag(YELLOW_ARCHER_CARD)
    const second = addCardToBag(YELLOW_ARCHER_CARD)
    expect(second.id).toBe(first.id)
    expect(getPlayerSnapshot().bag.find((item) => item.id === first.id)?.count).toBe(2)
    expect(useBagCard(first.id)).toBe(true)
    expect(getPlayerSnapshot().bag.find((item) => item.id === first.id)?.count).toBe(1)
    const equipped = getPlayerSnapshot().deck.at(-1)
    if (!equipped) throw new Error('缺卡')
    expect(unequipDeckCard(equipped.uid)).toBe(true)
    expect(getPlayerSnapshot().bag.find((item) => item.id === first.id)?.count).toBe(2)
    addCardToBag(YELLOW_ARCHER_CARD)
    expect(getPlayerSnapshot().bag.find((item) => item.id === first.id)?.count).toBe(3)
  })

  it('经验攒满当前等级所需就升级', () => {
    expect(expToNextLevel(1)).toBe(10)
    expect(getPlayerSnapshot().level).toBe(1)
    addExp(10)
    const player = getPlayerSnapshot()
    expect(player.level).toBe(2)
    expect(player.exp).toBe(0)
    expect(player.expToNext).toBe(20)
    expect(player.baseHp).toBe(20)
  })

  it('离线超过 10 分钟才结算挂机，并且不超过 8 小时', () => {
    const start = 1_700_000_000_000
    recordRealmClear('yellow-turban', 90_000)
    recordRealmClear('yellow-turban', 60_000)
    expect(getPlayerSnapshot().realms['yellow-turban']?.bestClearMs).toBe(60_000)
    toggleRealmIdle('yellow-turban', start)
    notePresence(start)
    const before = getPlayerSnapshot().gold
    expect(settleOfflineReturn(start + 9 * 60 * 1000)).toBeNull()
    expect(getPlayerSnapshot().gold).toBe(before)
    const report = settleOfflineReturn(start + 20 * 60 * 1000)
    expect(report?.clears).toBe(20)
    expect(getPlayerSnapshot().gold - before).toBe(20 * 30)
    expect(getPlayerSnapshot().activityLog[0]?.text.startsWith('通关[黄巾之乱] ×20, 获得:经验 200 · 金币 600')).toBe(true)
    const idleFrom = start + 20 * 60 * 1000
    notePresence(idleFrom)
    const capped = settleOfflineReturn(idleFrom + IDLE_CAP_MS + 2 * 60 * 60 * 1000)
    expect(capped?.clears).toBe(IDLE_CAP_MS / 60_000)
    expect(capped?.settledMs).toBe(IDLE_CAP_MS)
    expect(isIdling()).toBe(true)
    toggleRealmIdle('yellow-turban', idleFrom + IDLE_CAP_MS + 2 * 60 * 60 * 1000)
    expect(isIdling()).toBe(false)
    expect(shouldOfferIdle({})).toBe(false)
    expect(shouldOfferIdle({ 'yellow-turban': { bestClearMs: 60_000, idling: false, idleFrom: 0 } })).toBe(true)
    expect(shouldOfferIdle({ 'yellow-turban': { bestClearMs: 60_000, idling: true, idleFrom: 1 } })).toBe(false)
    expect(shouldOfferIdle(getPlayerSnapshot().realms)).toBe(true)
    startClearedIdle(idleFrom)
    expect(isIdling()).toBe(true)
    expect(shouldOfferIdle(getPlayerSnapshot().realms)).toBe(false)
    toggleRealmIdle('yellow-turban', idleFrom)
    expect(isIdling()).toBe(false)
  })

  it('坏档不用，完整存档可以盖回等级、金币、卡组和背包', () => {
    expect(playerSaveFrom({ gold: 1 })).toBeNull()
    const bareInfantry = { ...INFANTRY_CARD }
    delete (bareInfantry as { rarity?: string }).rarity
    const legacy = playerSaveFrom({
      gold: 1,
      level: 1,
      exp: 0,
      deckSeq: 1,
      bagSeq: 1,
      deck: [{ uid: 'd1', card: bareInfantry }],
      bag: [
        { id: 'b1', kind: 'card', card: bareInfantry },
        { id: 'b2', kind: 'card', card: INFANTRY_CARD, count: 1, instanceId: 'd9' },
      ],
    })
    expect(legacy?.bag).toHaveLength(1)
    expect(legacy?.bag[0]).toMatchObject({ kind: 'card', count: 2 })
    expect(legacy?.deck[0]?.card.rarity).toBe('white')
    if (legacy?.bag[0]?.kind === 'card') expect(legacy.bag[0].card.rarity).toBe('white')
    const bare = { ...INFANTRY_CARD, id: 'mystery' }
    delete (bare as { rarity?: string }).rarity
    expect(ensureCardRarity(bare).rarity).toBe('white')
    expect(ensureCardRarity({ ...INFANTRY_CARD, rarity: 'red' }).rarity).toBe('white')
    expect(ensureCardRarity({ ...bare, rarity: 'red' }).rarity).toBe('red')
    expect(legacy?.realms).toEqual({})
    expect(legacy?.activityLog).toEqual([])
    expect(legacy?.crystal).toBe(0)
    expect(legacy?.furnaceOffers).toEqual([])
    expect(
      playerSaveFrom({
        gold: 1,
        level: 1,
        exp: 0,
        deckSeq: 1,
        bagSeq: 1,
        deck: [],
        bag: [],
        activityLog: [{ at: 5, text: '战斗失败' }, { text: '缺时间' }, { at: 1, text: '' }],
      })?.activityLog,
    ).toEqual([{ at: 5, text: '战斗失败' }])
    restorePlayer({
      gold: 12,
      level: 4,
      exp: 3,
      deckSeq: 20,
      bagSeq: 8,
      deck: [{ uid: 'd20', card: INFANTRY_CARD }],
      bag: [{ id: 'b8', kind: 'card', card: INFANTRY_CARD, count: 1 }],
    })
    const player = getPlayerSnapshot()
    expect(player.gold).toBe(12)
    expect(player.level).toBe(4)
    expect(player.exp).toBe(3)
    expect(player.expToNext).toBe(40)
    expect(player.baseHp).toBe(40)
    expect(player.deck.map((entry) => entry.card.name)).toEqual(['步兵'])
    expect(player.bag.flatMap((item) => (item.kind === 'card' ? [item.card.name] : []))).toEqual(['步兵'])
    expect(player.activityLog).toEqual([])
  })

  it('首页日志记下通关和失败，时间是月/日 时分秒', () => {
    const at = new Date(2026, 9, 5, 19, 57, 3).getTime()
    const loot = { gold: 30, exp: 10, cards: [], materials: [] }
    noteBattleResult('黄巾之乱', 'win', loot, at)
    const win = getPlayerSnapshot().activityLog[0]
    expect(win?.text).toBe('通关[黄巾之乱], 获得:经验 10 · 金币 30')
    expect(formatActivityLine({ at, text: win?.text ?? '' })).toBe('10/5 19:57:03: 通关[黄巾之乱], 获得:经验 10 · 金币 30')
    noteBattleResult('黄巾之乱', 'lose', null, at + 1000)
    expect(getPlayerSnapshot().activityLog[0]?.text).toBe('战斗失败')
    noteBattleResult('黄巾之乱', 'draw', null, at + 2000)
    expect(getPlayerSnapshot().activityLog[0]?.text).toBe('战斗平局')
    for (let index = 0; index < ACTIVITY_LOG_LIMIT; index += 1) noteBattleResult('黄巾之乱', 'lose', null, at)
    expect(getPlayerSnapshot().activityLog).toHaveLength(ACTIVITY_LOG_LIMIT)
  })

  it('分解背包卡得到水晶，合成按配方扣卡、材料和水晶', () => {
    ensureFurnaceOffers()
    const infantry = addCardToBag(INFANTRY_CARD)
    expect(decomposeBagCard(infantry.id)).toBe(1)
    expect(getPlayerSnapshot().crystal).toBeGreaterThanOrEqual(1)
    expect(decomposeBagCard('missing')).toBe(0)
    const beforeCrystal = getPlayerSnapshot().crystal
    addCardToBag(INFANTRY_CARD)
    addMaterialToBag('iron-ore', '铁矿石', 10)
    expect(craftFurnaceRecipe('heavy-infantry')?.name).toBe('重甲步兵')
    expect(getPlayerSnapshot().bag.some((item) => item.kind === 'card' && item.card.id === 'heavy-infantry')).toBe(true)
    expect(getPlayerSnapshot().crystal).toBe(beforeCrystal)
    const short = addCardToBag(INFANTRY_CARD)
    expect(craftFurnaceRecipe('heavy-infantry')).toBeNull()
    expect(getPlayerSnapshot().bag.find((item) => item.id === short.id)?.count).toBeGreaterThan(0)
    expect(craftFurnaceRecipe('paladin')).toBeNull()
  })

  it('黄巾步兵和黄巾弓箭手加水晶可以合成张角，刷新要花水晶', () => {
    ensureFurnaceOffers()
    addCardToBag(YELLOW_INFANTRY_CARD, 10)
    addCardToBag(YELLOW_ARCHER_CARD, 10)
    while (getPlayerSnapshot().crystal < 100) decomposeBagCard(addCardToBag(INFANTRY_CARD).id)
    const before = getPlayerSnapshot().crystal
    expect(craftFurnaceRecipe('zhang-jiao')?.name).toBe('天公将军张角')
    expect(getPlayerSnapshot().crystal).toBe(before - 100)
    while (getPlayerSnapshot().crystal < FURNACE_REFRESH_CRYSTAL) decomposeBagCard(addCardToBag(INFANTRY_CARD).id)
    const offers = [...getPlayerSnapshot().furnaceOffers]
    const paid = getPlayerSnapshot().crystal
    expect(refreshFurnaceOffers(() => 0.99)).toBe(true)
    expect(getPlayerSnapshot().crystal).toBe(paid - FURNACE_REFRESH_CRYSTAL)
    expect([...getPlayerSnapshot().furnaceOffers].sort().join('|')).not.toBe([...offers].sort().join('|'))
    expect(refreshFurnaceOffers(() => 0.5)).toBe(false)
  })
})