import { armorSkill, type UnitCardData } from './cards'

/**
 * 水元素。大法师每回合召出来的单位，同时进图鉴。
 * 数值按步兵收一档：能站住，但自己没有技能。
 */
export const WATER_ELEMENTAL_CARD: UnitCardData = {
  id: 'water-elemental',
  name: '水元素',
  rarity: 'white',
  mark: '水',
  race: 'human',
  profession: '元素',
  cd: 1,
  atk: 2,
  hp: 4,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [],
}

/**
 * 绵羊。女巫变形术的产物，不进图鉴。
 * 攻击为 0，血量压到 2，用来拆掉敌方的输出。
 */
export const SHEEP_CARD: UnitCardData = {
  id: 'sheep',
  name: '绵羊',
  rarity: 'white',
  mark: '羊',
  race: 'human',
  profession: '野兽',
  cd: 1,
  atk: 0,
  hp: 2,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [],
}

/**
 * 骑士。人类重甲骑兵，移动快，冲锋后这一击更疼。
 * 重甲对应战争3的重甲，冲锋对应骑兵先跑再打的手感。
 */
export const KNIGHT_CARD: UnitCardData = {
  id: 'knight',
  name: '骑士',
  rarity: 'blue',
  mark: '马',
  race: 'human',
  profession: '骑士',
  cd: 2,
  atk: 3,
  hp: 6,
  move: 3,
  speed: 4,
  range: 1,
  attackKind: 'physical',
  skills: [
    armorSkill('plate', 1),
    { name: '冲锋 2', effect: '本回合移动后再攻击时，额外造成 2 点伤害', kind: 'charge', value: 2 },
  ],
}

/**
 * 牧师。人类治疗者，攻击低、射程远。
 * 治疗对应战争3的治疗术，心灵之火给最虚弱的友方加攻击。
 */
export const PRIEST_CARD: UnitCardData = {
  id: 'priest',
  name: '牧师',
  rarity: 'green',
  mark: '牧',
  race: 'human',
  profession: '牧师',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '治疗 2', effect: '行动开始前，为生命值最低的友方回复 2 点生命值', kind: 'heal', value: 2 },
    { name: '心灵之火 1', effect: '行动开始前，为生命值最低的友方增加 1 点攻击，直到该友方完成一次攻击', kind: 'innerFire', value: 1 },
  ],
}

/**
 * 女巫。高等精灵控制。减速挂在普攻上，变形术只吃血量不高的目标。
 * 法术免疫的单位不会被变成绵羊。绵羊持续到本回合结束，下回合变回。
 */
export const SORCERESS_CARD: UnitCardData = {
  id: 'sorceress',
  name: '女巫',
  rarity: 'blue',
  mark: '巫',
  race: 'highElf',
  profession: '女巫',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '减速 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
    {
      name: '变形术 3',
      effect: '行动开始前，将范围内生命不超过 3、且没有法术免疫的一名敌方变为绵羊，持续到本回合结束',
      kind: 'polymorph',
      value: 3,
    },
  ],
}

/**
 * 破法者。高等精灵近战，专门针对法师。
 * 法术免疫挡伤害和法术控制，反馈在打法师（含牧师、女巫）时加伤。
 */
export const SPELL_BREAKER_CARD: UnitCardData = {
  id: 'spell-breaker',
  name: '破法者',
  rarity: 'blue',
  mark: '破',
  race: 'highElf',
  profession: '破法者',
  cd: 2,
  atk: 3,
  hp: 5,
  move: 2,
  speed: 3,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '法术免疫', effect: '受到的法术伤害变为 0，也不受减速、变形、风暴之锤和雷霆一击影响', kind: 'spellImmune' },
    { name: '反馈 2', effect: '攻击法师时额外造成 2 点伤害', kind: 'feedback', value: 2 },
  ],
}

/**
 * 迫击炮小队。矮人远程攻城，自己很脆，打中后会溅到旁边。
 * 碎片攻击对应战争3的碎片爆炸升级。
 */
export const MORTAR_TEAM_CARD: UnitCardData = {
  id: 'mortar-team',
  name: '迫击炮小队',
  rarity: 'blue',
  mark: '炮',
  race: 'dwarf',
  profession: '炮兵',
  cd: 3,
  atk: 4,
  hp: 3,
  move: 1,
  speed: 1,
  range: 4,
  attackKind: 'physical',
  skills: [{ name: '碎片攻击 2', effect: '普攻命中单位时，对目标相邻的其他敌方造成 2 点物理伤害', kind: 'splash', value: 2 }],
}

/**
 * 攻城器械。矮人蒸汽坦克，厚重甲，打大本营更疼。
 * 炮击对应战争3的对建筑追加伤害。
 */
export const SIEGE_ENGINE_CARD: UnitCardData = {
  id: 'siege-engine',
  name: '攻城器械',
  rarity: 'blue',
  mark: '城',
  race: 'dwarf',
  profession: '攻城',
  cd: 3,
  atk: 3,
  hp: 7,
  move: 1,
  speed: 1,
  range: 2,
  attackKind: 'physical',
  skills: [armorSkill('plate', 2), { name: '炮击 3', effect: '攻击大本营时额外造成 3 点伤害', kind: 'siege', value: 3 }],
}

/**
 * 飞行器。侏儒机械，能飞过河流和石头，炸弹带一小圈溅射。
 * 人类阵营里侏儒只有这一只量产单位。
 */
export const FLYING_MACHINE_CARD: UnitCardData = {
  id: 'flying-machine',
  name: '飞行器',
  rarity: 'green',
  mark: '机',
  race: 'gnome',
  profession: '机械',
  cd: 2,
  atk: 2,
  hp: 2,
  move: 3,
  speed: 4,
  range: 2,
  attackKind: 'physical',
  skills: [
    { name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' },
    { name: '炸弹 1', effect: '普攻命中单位时，对目标相邻的其他敌方造成 1 点物理伤害', kind: 'splash', value: 1 },
  ],
}

/**
 * 狮鹫骑士。矮人狮鹫骑士，飞行并且用风暴之锤打建筑更疼。
 * 射程就是扔出的锤子，攻城加伤对应战争3的攻城伤害。
 */
export const GRYPHON_RIDER_CARD: UnitCardData = {
  id: 'gryphon-rider',
  name: '狮鹫骑士',
  rarity: 'blue',
  mark: '鹫',
  race: 'dwarf',
  profession: '狮鹫',
  cd: 3,
  atk: 4,
  hp: 5,
  move: 3,
  speed: 3,
  range: 3,
  attackKind: 'physical',
  skills: [
    { name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' },
    { name: '风暴之锤', effect: '攻击大本营时额外造成 2 点伤害', kind: 'siege', value: 2 },
  ],
}

/**
 * 大法师。人类英雄。暴风雪打范围内的敌人，水元素每回合站出来，光环给身边加速。
 * 不做法师的终极技能群体传送。
 */
export const ARCHMAGE_CARD: UnitCardData = {
  id: 'archmage',
  name: '大法师',
  rarity: 'purple',
  mark: '大',
  race: 'human',
  profession: '法师',
  cd: 4,
  atk: 3,
  hp: 5,
  move: 2,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '暴风雪 2', effect: '行动开始前，对范围内所有敌方造成 2 点法术伤害', kind: 'blizzard', value: 2 },
    { name: '水元素', effect: '每回合开始在周围召唤一个水元素', kind: 'bean', summons: [WATER_ELEMENTAL_CARD] },
    { name: '辉煌光环 1', effect: '范围内友方（含自己）行动速度 +1', kind: 'aura', value: 1 },
  ],
}

/**
 * 山丘之王。矮人英雄。风暴之锤打最近的人并打断行动，雷霆一击打身边，重击取消目标剩余行动。
 * 不放天神下凡。
 */
export const MOUNTAIN_KING_CARD: UnitCardData = {
  id: 'mountain-king',
  name: '山丘之王',
  rarity: 'orange',
  mark: '山',
  race: 'dwarf',
  profession: '战士',
  cd: 4,
  atk: 3,
  hp: 8,
  move: 2,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    {
      name: '风暴之锤 2',
      effect: '行动开始前，对最近的敌方造成 2 点法术伤害，并取消其本回合剩余行动。法术免疫可挡下',
      kind: 'stormBolt',
      value: 2,
    },
    {
      name: '雷霆一击 2',
      effect: '行动开始前，对相邻敌方造成 2 点法术伤害，并使其下次移动 -1（最低 1）。法术免疫可挡下',
      kind: 'thunderClap',
      value: 2,
    },
    { name: '重击', effect: '普攻命中后，取消目标本回合剩余行动', kind: 'bash' },
  ],
}

/** 人类阵营这批单位和英雄，含水元素。图鉴和 GM 用这份 */
export const ALLIANCE_CARDS: readonly UnitCardData[] = [
  KNIGHT_CARD,
  PRIEST_CARD,
  SORCERESS_CARD,
  SPELL_BREAKER_CARD,
  MORTAR_TEAM_CARD,
  SIEGE_ENGINE_CARD,
  FLYING_MACHINE_CARD,
  GRYPHON_RIDER_CARD,
  ARCHMAGE_CARD,
  WATER_ELEMENTAL_CARD,
  MOUNTAIN_KING_CARD,
]
