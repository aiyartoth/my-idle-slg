import { armorSkill, type UnitCardData } from './cards'

/**
 * 魔兽世界职业单位。数值对齐现有兵种，技能都进战斗结算。
 * 普通职业蓝绿，英雄紫，死亡骑士橙。
 */

/**
 * 战士。冲上去打，斩杀掉血已经见底的目标。
 * 冲锋对应冲锋，斩杀对应斩杀。
 */
export const WARRIOR_CARD: UnitCardData = {
  id: 'warrior',
  name: '战士',
  rarity: 'blue',
  mark: '战',
  race: 'human',
  profession: '战士',
  cd: 2,
  atk: 3,
  hp: 6,
  move: 2,
  speed: 3,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '冲锋 2', effect: '本回合移动后再攻击时，额外造成 2 点伤害', kind: 'charge', value: 2 },
    { name: '斩杀 2', effect: '攻击生命不超过 2 的单位时，额外造成 2 点伤害', kind: 'execute', value: 2 },
  ],
}

/**
 * 圣骑士加文拉德。紫色传奇，名气低于乌瑟尔和莫格莱尼。站到前面吃攻击，给最虚弱的友方刷圣光，自己穿着重甲。
 * 嘲讽让敌人改打他，圣光术按治疗结算。
 */
export const PALADIN_CARD: UnitCardData = {
  id: 'paladin',
  name: '圣骑士加文拉德',
  rarity: 'purple',
  mark: '加',
  race: 'human',
  profession: '圣骑士',
  cd: 3,
  atk: 2,
  hp: 7,
  move: 2,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '嘲讽', effect: '敌方会优先靠近并攻击这名单位', kind: 'taunt' },
    armorSkill('plate', 1),
    { name: '圣光术 2', effect: '行动开始前，为生命值最低的友方回复 2 点生命值', kind: 'heal', value: 2 },
  ],
}

/**
 * 猎人。远程点名，打中后箭矢溅到旁边，破甲用来对付重甲。
 * 多重射击按碎片溅射结算。
 */
export const HUNTER_CARD: UnitCardData = {
  id: 'hunter',
  name: '猎人',
  rarity: 'green',
  mark: '猎',
  race: 'human',
  profession: '猎人',
  cd: 2,
  atk: 3,
  hp: 3,
  move: 2,
  speed: 3,
  range: 4,
  attackKind: 'physical',
  skills: [
    armorSkill('pierce', 1),
    { name: '多重射击 2', effect: '普攻命中单位时，对目标相邻的其他敌方造成 2 点物理伤害', kind: 'splash', value: 2 },
  ],
}

/**
 * 潜行者。先贴近再打，命中后打断目标还没做完的行动。
 * 肾击按重击结算，取消目标本回合剩余步骤。
 */
export const ROGUE_CARD: UnitCardData = {
  id: 'rogue',
  name: '潜行者',
  rarity: 'blue',
  mark: '刺',
  race: 'human',
  profession: '潜行者',
  cd: 2,
  atk: 4,
  hp: 3,
  move: 3,
  speed: 4,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '突袭 2', effect: '本回合移动后再攻击时，额外造成 2 点伤害', kind: 'charge', value: 2 },
    { name: '肾击', effect: '普攻命中后，取消目标本回合剩余行动', kind: 'bash' },
  ],
}

/**
 * 暗影牧师。先对随机敌人放暗言术，普攻再吸回一点生命。
 * 暗言术：灭走雷电招来，吸血鬼之触走吸血。
 */
export const SHADOW_PRIEST_CARD: UnitCardData = {
  id: 'shadow-priest',
  name: '暗影牧师',
  rarity: 'blue',
  mark: '暗',
  race: 'human',
  profession: '牧师',
  cd: 3,
  atk: 3,
  hp: 3,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '暗言术：灭 2', effect: '对随机一个敌方造成 2 点法术伤害', kind: 'lightning', value: 2 },
    { name: '吸血鬼之触 1', effect: '普攻命中单位后，为自己回复 1 点生命，不超过上限', kind: 'leech', value: 1 },
  ],
}

/**
 * 萨满德雷克塔尔。紫色传奇，霜狼氏族的老萨满，名气低于萨尔。闪电打随机敌人，嗜血让身边的友方更快行动。
 * 闪电箭走雷电招来，嗜血走速度光环。
 */
export const SHAMAN_CARD: UnitCardData = {
  id: 'shaman',
  name: '萨满德雷克塔尔',
  rarity: 'purple',
  mark: '德',
  race: 'orc',
  profession: '萨满',
  cd: 3,
  atk: 3,
  hp: 5,
  move: 2,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '闪电箭 3', effect: '对随机一个敌方造成 3 点法术伤害', kind: 'lightning', value: 3 },
    { name: '嗜血 1', effect: '范围内友方（含自己）行动速度 +1', kind: 'aura', value: 1 },
  ],
}

/**
 * 冰霜法师。普攻挂减速，行动前先对射程内的敌人下暴风雪。
 * 减速和暴风雪都按已有法术结算，法术免疫可以挡下。
 */
export const FROST_MAGE_CARD: UnitCardData = {
  id: 'frost-mage',
  name: '冰霜法师',
  rarity: 'blue',
  mark: '冰',
  race: 'human',
  profession: '法师',
  cd: 3,
  atk: 3,
  hp: 3,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '寒冰箭 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
    { name: '暴风雪 2', effect: '行动开始前，对范围内所有敌方造成 2 点法术伤害', kind: 'blizzard', value: 2 },
  ],
}

/**
 * 术士。暗影箭打随机敌人，普攻再挂一层减速诅咒。
 * 暗影箭走雷电招来，腐蚀术走减速。
 */
export const WARLOCK_CARD: UnitCardData = {
  id: 'warlock',
  name: '术士',
  rarity: 'blue',
  mark: '术',
  race: 'human',
  profession: '术士',
  cd: 3,
  atk: 3,
  hp: 4,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '暗影箭 2', effect: '对随机一个敌方造成 2 点法术伤害', kind: 'lightning', value: 2 },
    {
      name: '腐蚀术 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/**
 * 德鲁伊纳拉雷克斯。紫色传奇，尖牙德鲁伊，名气低于玛法里奥。先治疗，再给最虚弱的友方加攻击，普攻还能缠住敌人。
 * 愈合、野性印记、纠缠根须分别按治疗、心灵之火和减速结算。
 */
export const DRUID_CARD: UnitCardData = {
  id: 'druid',
  name: '德鲁伊纳拉雷克斯',
  rarity: 'purple',
  mark: '纳',
  race: 'nightElf',
  profession: '德鲁伊',
  cd: 3,
  atk: 2,
  hp: 5,
  move: 2,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '愈合 2', effect: '行动开始前，为生命值最低的友方回复 2 点生命值', kind: 'heal', value: 2 },
    { name: '野性印记 1', effect: '行动开始前，为生命值最低的友方增加 1 点攻击，直到该友方完成一次攻击，不可叠加', kind: 'innerFire', value: 1 },
    {
      name: '纠缠根须 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/**
 * 死亡骑士达里安。橙色传奇，黑锋骑士团的领袖，名气高于普通死亡骑士，仍低于巫妖王。站前面嘲讽，普攻减速，打中后吸回生命。
 * 凋零缠绕按吸血结算，冰霜打击按减速结算。
 */
export const DEATH_KNIGHT_CARD: UnitCardData = {
  id: 'death-knight',
  name: '死亡骑士达里安',
  rarity: 'orange',
  mark: '达',
  race: 'human',
  profession: '死亡骑士',
  cd: 4,
  atk: 3,
  hp: 8,
  move: 2,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '嘲讽', effect: '敌方会优先靠近并攻击这名单位', kind: 'taunt' },
    { name: '凋零缠绕 2', effect: '普攻命中单位后，为自己回复 2 点生命，不超过上限', kind: 'leech', value: 2 },
    {
      name: '冰霜打击 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/** 这十张魔兽世界职业卡。图鉴和 GM 用这份 */
export const WOW_CARDS: readonly UnitCardData[] = [
  WARRIOR_CARD,
  PALADIN_CARD,
  HUNTER_CARD,
  ROGUE_CARD,
  SHADOW_PRIEST_CARD,
  SHAMAN_CARD,
  FROST_MAGE_CARD,
  WARLOCK_CARD,
  DRUID_CARD,
  DEATH_KNIGHT_CARD,
]
