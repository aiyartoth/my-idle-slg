import { describe, expect, it } from 'vitest'
import { calcDamage, resolveBattle } from './resolveBattle'
import { COUNTER, PRESET_SPEAR_BACK, PRESET_SPEAR_FRONT } from './units'

describe('resolveBattle', () => {
  it('枪在后排时第 4 回合溃败，战报对照 710 和 1421', () => {
    const battle = resolveBattle(PRESET_SPEAR_BACK.player, PRESET_SPEAR_BACK.enemy)

    expect(battle.result).toBe('lose')
    expect(battle.rounds).toBe(4)
    expect(battle.playerPct).toBe(12)
    expect(battle.enemyPct).toBe(21)
    expect(battle.lines[0]).toBe('败。第 4 回合我方兵力 12%，敌方 21%。')
    expect(battle.lines[1]).toBe('枪兵克制骑兵，实际伤害 710；站到前排则是 1421。')
    expect(battle.lines[2]).toBe('敌方骑兵切后排枪兵，伤害 937。')
    expect(battle.log).toMatchObject([
      { round: 1, playerFrontHp: 3800, playerBackHp: 2663, enemyFrontHp: 1683, enemyBackHp: 2200, playerPct: 75, enemyPct: 72 },
      { round: 2, playerFrontHp: 2600, playerBackHp: 1726, enemyFrontHp: 166, enemyBackHp: 2200, playerPct: 50, enemyPct: 44 },
      { round: 3, playerFrontHp: 1400, playerBackHp: 789, enemyFrontHp: 0, enemyBackHp: 2200, playerPct: 25, enemyPct: 41 },
      { round: 4, playerFrontHp: 200, playerBackHp: 789, enemyFrontHp: 0, enemyBackHp: 1127, playerPct: 12, enemyPct: 21 },
    ])
  })

  it('枪在前排时第 3 回合取胜', () => {
    const battle = resolveBattle(PRESET_SPEAR_FRONT.player, PRESET_SPEAR_FRONT.enemy)

    expect(battle.result).toBe('win')
    expect(battle.rounds).toBe(3)
    expect(battle.playerPct).toBe(36)
    expect(battle.enemyPct).toBe(18)
    expect(battle.lines[0]).toBe('胜。第 3 回合敌方兵力 18%，我方 36%。')
    expect(battle.lines[1]).toBe('枪兵克制骑兵，实际伤害 1421。')
    expect(battle.lines[2]).toBe('敌方骑兵切后排盾兵，伤害 964。')
    expect(battle.log).toMatchObject([
      { round: 1, playerFrontHp: 2025, playerBackHp: 4036, enemyFrontHp: 1376, enemyBackHp: 2200, playerPct: 70, enemyPct: 66 },
      { round: 2, playerFrontHp: 450, playerBackHp: 3072, enemyFrontHp: 0, enemyBackHp: 2200, playerPct: 41, enemyPct: 41 },
      { round: 3, playerFrontHp: 0, playerBackHp: 3072, enemyFrontHp: 0, enemyBackHp: 998, playerPct: 36, enemyPct: 18 },
    ])
  })

  it('双方编制相同则打满 6 回合平局', () => {
    const formation = PRESET_SPEAR_FRONT.player
    const battle = resolveBattle(formation, formation)

    expect(battle.result).toBe('draw')
    expect(battle.rounds).toBe(6)
    expect(battle.playerPct).toBe(38)
    expect(battle.enemyPct).toBe(38)
    expect(battle.log[5]).toMatchObject({
      playerFrontHp: 0,
      playerBackHp: 3287,
      enemyFrontHp: 0,
      enemyBackHp: 3287,
    })
  })

  it('同一输入结算两次，回合表一致', () => {
    const first = resolveBattle(PRESET_SPEAR_BACK.player, PRESET_SPEAR_BACK.enemy)
    const second = resolveBattle(PRESET_SPEAR_BACK.player, PRESET_SPEAR_BACK.enemy)
    expect(second).toEqual(first)
  })

  it('前排弓兵承伤按 125 计算', () => {
    expect(calcDamage(1400, 100, 100, 100, 8)).toBe(1296)
    expect(calcDamage(1400, 100, 100, 125, 8)).toBe(1620)
  })

  it('汇总每个兵种造成的伤害和被击溃的人数', () => {
    const battle = resolveBattle(PRESET_SPEAR_BACK.player, PRESET_SPEAR_BACK.enemy)

    expect(battle.playerDamage).toEqual([
      { attacker: 'shield', target: 'cavalry', damage: 2421 },
      { attacker: 'spear', target: 'cavalry', damage: 2130 },
      { attacker: 'shield', target: 'archer', damage: 629 },
      { attacker: 'spear', target: 'archer', damage: 444 },
    ])
    expect(battle.enemyDamage).toEqual([
      { attacker: 'cavalry', target: 'spear', damage: 2811 },
      { attacker: 'archer', target: 'shield', damage: 4800 },
    ])
    expect(battle.enemyRout).toEqual([
      { unitId: 'cavalry', lost: 100, remaining: 0 },
      { unitId: 'archer', lost: 49, remaining: 51 },
    ])
    expect(battle.playerRout).toEqual([
      { unitId: 'shield', lost: 96, remaining: 4 },
      { unitId: 'spear', lost: 78, remaining: 22 },
    ])
  })

  it('重骑在前排切后排，弩兵在后排不减出力', () => {
    const charge = resolveBattle(
      { front: 'heavy', back: 'shield' },
      { front: 'archer', back: 'shield' },
    )
    expect(charge.log[0]?.playerHits[0]).toMatchObject({
      attacker: 'heavy',
      target: 'shield',
      targetSlot: 'back',
    })

    const volley = resolveBattle(
      { front: 'shield', back: 'crossbow' },
      { front: 'shield', back: 'spear' },
    )
    expect(volley.log[0]?.playerHits.find((hit) => hit.attacker === 'crossbow')?.damage).toBe(
      calcDamage(1600, COUNTER.crossbow.shield, 100, 100, 40),
    )
  })
})
