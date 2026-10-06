import { armorSkill, type UnitCardData } from './cards'

/**
 * 魔兽争霸 3 战役兵种。人类兵已经在基础卡和联盟卡里，这里补兽人、亡灵和暗夜精灵。
 * 白到紫都有。技能都进战斗结算，召唤物是白卡，不进牌库。
 */

/** 骷髅。亡灵巫师击杀后留在死者的格子上，自己没有技能 */
export const SKELETON_CARD: UnitCardData = {
  id: 'skeleton',
  name: '骷髅',
  rarity: 'white',
  mark: '骷',
  race: 'undead',
  profession: '骷髅',
  cd: 1,
  atk: 1,
  hp: 2,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [],
}

/**
 * 兽人步兵。绿色前线，比人族步兵更皮，攻击也更高，靠重甲挡物理。
 */
export const GRUNT_CARD: UnitCardData = {
  id: 'grunt',
  name: '兽人步兵',
  rarity: 'green',
  mark: '蛮',
  race: 'orc',
  profession: '步兵',
  cd: 2,
  atk: 3,
  hp: 6,
  move: 1,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [armorSkill('plate', 1)],
}

/**
 * 掠夺者。狼骑兵冲得快，网住被打中的人。
 * 诱捕按减速结算：下次移动少 1，留到下回合还会压行动速度。
 */
export const RAIDER_CARD: UnitCardData = {
  id: 'raider',
  name: '掠夺者',
  rarity: 'green',
  mark: '掠',
  race: 'orc',
  profession: '掠夺者',
  cd: 2,
  atk: 2,
  hp: 4,
  move: 3,
  speed: 4,
  range: 1,
  attackKind: 'physical',
  skills: [
    {
      name: '诱捕 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/**
 * 巫医。治疗守卫给每个受伤的友方回一点，自己也算。
 */
export const WITCH_DOCTOR_CARD: UnitCardData = {
  id: 'witch-doctor',
  name: '巫医',
  rarity: 'green',
  mark: '医',
  race: 'orc',
  profession: '巫医',
  cd: 2,
  atk: 1,
  hp: 4,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [{ name: '治疗守卫 1', effect: '行动开始前，为每个友方回复 1 点生命，不超过各自上限', kind: 'massHeal', value: 1 }],
}

/**
 * 女猎手。月刃打中之后，再溅到目标身边的敌人。
 */
export const HUNTRESS_CARD: UnitCardData = {
  id: 'huntress',
  name: '女猎手',
  rarity: 'green',
  mark: '女',
  race: 'nightElf',
  profession: '女猎手',
  cd: 2,
  atk: 2,
  hp: 4,
  move: 2,
  speed: 3,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '月刃 1', effect: '普攻命中单位时，对目标相邻的其他敌方造成 1 点物理伤害', kind: 'splash', value: 1 },
  ],
}

/**
 * 牛头人。厚血，先踩一圈身边的人，自己也穿着一层重甲。
 * 粉碎按雷霆一击结算：相邻法术伤害，并让人下次少走 1 格。
 */
export const TAUREN_CARD: UnitCardData = {
  id: 'tauren',
  name: '牛头人',
  rarity: 'blue',
  mark: '牛',
  race: 'orc',
  profession: '战士',
  cd: 3,
  atk: 3,
  hp: 8,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    {
      name: '粉碎 1',
      effect: '行动开始前，对相邻敌方造成 1 点法术伤害，并使其下次移动 -1（最低 1）。法术免疫可挡下',
      kind: 'thunderClap',
      value: 1,
    },
    armorSkill('plate', 1),
  ],
}

/**
 * 科多兽。战鼓给攻击范围内的友方普攻加攻击，吞噬补刀血已经不多的目标。
 */
export const KODO_CARD: UnitCardData = {
  id: 'kodo',
  name: '科多兽',
  rarity: 'blue',
  mark: '科',
  race: 'orc',
  profession: '科多兽',
  cd: 3,
  atk: 2,
  hp: 8,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '战鼓 1', effect: '攻击范围内的友方普攻攻击 +1，自己也算', kind: 'drums', value: 1 },
    {
      name: '吞噬 4',
      effect: '攻击生命不超过 4 的单位时，额外造成 4 点伤害。飞行、传奇生物、抗性皮肤和法术免疫不受影响',
      kind: 'devour',
      value: 4,
    },
  ],
}

/**
 * 憎恶。站前面吃打，打中人就吸一口血。
 */
export const ABOMINATION_CARD: UnitCardData = {
  id: 'abomination',
  name: '憎恶',
  rarity: 'blue',
  mark: '憎',
  race: 'undead',
  profession: '憎恶',
  cd: 3,
  atk: 3,
  hp: 8,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '嘲讽', effect: '敌方会优先靠近并攻击这名单位', kind: 'taunt' },
    { name: '食尸 2', effect: '普攻命中单位后，为自己回复 2 点生命，不超过上限', kind: 'leech', value: 2 },
  ],
}

/**
 * 亡灵巫师。残废让打中的人变慢，击杀后在原地留下一只骷髅，场上最多一只。
 */
export const NECROMANCER_CARD: UnitCardData = {
  id: 'necromancer',
  name: '亡灵巫师',
  rarity: 'blue',
  mark: '骨',
  race: 'undead',
  profession: '巫师',
  cd: 2,
  atk: 2,
  hp: 4,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '残废 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
    {
      name: '亡者复生',
      effect: '普攻击杀敌方单位后，在该格召唤一只骷髅。场上自己的骷髅最多一只',
      kind: 'raise',
      value: 1,
      summons: [SKELETON_CARD],
    },
  ],
}

/**
 * 冰霜巨龙。飞过河，吐息让人变慢，打建筑更疼。
 */
export const FROST_WYRM_CARD: UnitCardData = {
  id: 'frost-wyrm',
  name: '冰霜巨龙',
  rarity: 'purple',
  mark: '龙',
  race: 'undead',
  profession: '冰霜巨龙',
  cd: 4,
  atk: 3,
  hp: 8,
  move: 2,
  speed: 2,
  range: 4,
  attackKind: 'physical',
  skills: [
    { name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' },
    {
      name: '霜寒 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
    { name: '冰冻吐息 3', effect: '攻击大本营时额外造成 3 点伤害', kind: 'siege', value: 3 },
  ],
}

/**
 * 山岭巨人。硬化皮肤挡物理，嘲讽把仇恨拉到自己身上。
 */
export const MOUNTAIN_GIANT_CARD: UnitCardData = {
  id: 'mountain-giant',
  name: '山岭巨人',
  rarity: 'purple',
  mark: '巨',
  race: 'nightElf',
  profession: '巨人',
  cd: 4,
  atk: 3,
  hp: 10,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '嘲讽', effect: '敌方会优先靠近并攻击这名单位', kind: 'taunt' },
    armorSkill('plate', 2),
  ],
}

/** 战役兵种。图鉴和掉落按这个名单收录，不含召唤物 */
export const CAMPAIGN_CARDS: readonly UnitCardData[] = [
  GRUNT_CARD,
  RAIDER_CARD,
  WITCH_DOCTOR_CARD,
  HUNTRESS_CARD,
  TAUREN_CARD,
  KODO_CARD,
  ABOMINATION_CARD,
  NECROMANCER_CARD,
  FROST_WYRM_CARD,
  MOUNTAIN_GIANT_CARD,
]

/** 战役召唤物。只在场上被召出来 */
export const CAMPAIGN_TOKEN_CARDS: readonly UnitCardData[] = [SKELETON_CARD]
