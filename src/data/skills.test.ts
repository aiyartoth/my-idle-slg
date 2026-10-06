import { describe, expect, it } from 'vitest'
import { strikeDamage } from '../realm/battle'
import { ALL_CARDS } from './cardCatalog'
import { BASIC_UNIT_CARDS, INFANTRY_CARD, skillLine, type CardSkill, type UnitCardData } from './cards'

/** 不改普攻伤害、但在战斗里另有结算的技能。改了普攻的不放这里 */
const SETTLED_SKILL_KINDS = new Set<CardSkill['kind']>([
  'heal',
  'vigilance',
  'bean',
  'lightning',
  'charge',
  'innerFire',
  'slow',
  'polymorph',
  'splash',
  'siege',
  'fly',
  'blizzard',
  'aura',
  'stormBolt',
  'thunderClap',
  'bash',
])

describe('技能是否进了战斗', () => {
  it('改变伤害的技能算生效，不改伤害且没有独立结算的必须标未实现', () => {
    const heavy = BASIC_UNIT_CARDS.find((card) => card.id === 'heavy-infantry')
    const ward = BASIC_UNIT_CARDS.find((card) => card.id === 'ward-guard')
    if (!heavy || !ward) throw new Error('缺卡')
    const spell: UnitCardData = { ...INFANTRY_CARD, id: 'spell-dummy', attackKind: 'spell', atk: 4, skills: [] }
    const foes = [INFANTRY_CARD, heavy, ward, spell]
    const missed = ALL_CARDS.flatMap((card) => card.skills.map((skill) => ({ card, skill }))).flatMap(({ card, skill }) => {
      if (skill.kind && SETTLED_SKILL_KINDS.has(skill.kind)) {
        return skill.unimplemented ? [`${card.name} ${skill.name} 已实现，不应标未实现`] : []
      }
      const active = changesDamage(card, skill, foes)
      if (skill.unimplemented) {
        return active || !skillLine(skill).startsWith('未实现 ') ? [`${card.name} ${skill.name} 未实现标记和结算不一致`] : []
      }
      return active ? [] : [`${card.name} ${skill.name} 没有改变伤害，也没标未实现`]
    })
    expect(missed).toEqual([])
    expect(ALL_CARDS.find((card) => card.id === 'temple-knight')?.skills.map((skill) => skill.kind)).toEqual(['heal', 'vigilance'])
    expect(ALL_CARDS.find((card) => card.id === 'zhang-jiao')?.skills.map((skill) => skill.kind)).toEqual(['bean', 'lightning'])
    expect(ALL_CARDS.find((card) => card.id === 'knight')?.skills.map((skill) => skill.kind)).toEqual(['plate', 'charge'])
    expect(ALL_CARDS.find((card) => card.id === 'priest')?.skills.map((skill) => skill.kind)).toEqual(['heal', 'innerFire'])
    expect(ALL_CARDS.find((card) => card.id === 'sorceress')?.skills.map((skill) => skill.kind)).toEqual(['slow', 'polymorph'])
    expect(ALL_CARDS.find((card) => card.id === 'spell-breaker')?.skills.map((skill) => skill.kind)).toEqual(['spellImmune', 'feedback'])
    expect(ALL_CARDS.find((card) => card.id === 'mortar-team')?.skills.map((skill) => skill.kind)).toEqual(['splash'])
    expect(ALL_CARDS.find((card) => card.id === 'siege-engine')?.skills.map((skill) => skill.kind)).toEqual(['plate', 'siege'])
    expect(ALL_CARDS.find((card) => card.id === 'flying-machine')?.skills.map((skill) => skill.kind)).toEqual(['fly', 'splash'])
    expect(ALL_CARDS.find((card) => card.id === 'gryphon-rider')?.skills.map((skill) => skill.kind)).toEqual(['fly', 'siege'])
    expect(ALL_CARDS.find((card) => card.id === 'archmage')?.skills.map((skill) => skill.kind)).toEqual(['blizzard', 'bean', 'aura'])
    expect(ALL_CARDS.find((card) => card.id === 'mountain-king')?.skills.map((skill) => skill.kind)).toEqual(['stormBolt', 'thunderClap', 'bash'])
  })
})

/**
 * 拿掉这一条技能后，对几个对手的攻防伤害有没有变化。
 *
 * @param card 带技能的牌
 * @param skill 要检查的那一条
 * @param foes 用来试攻和试守的牌
 * @returns 伤害有变化时为 true
 */
function changesDamage(card: UnitCardData, skill: CardSkill, foes: readonly UnitCardData[]): boolean {
  const bare = { ...card, skills: card.skills.filter((item) => item !== skill) }
  return foes.some((foe) => strikeDamage(card, foe) !== strikeDamage(bare, foe) || strikeDamage(foe, card) !== strikeDamage(foe, bare))
}
