import { armorSkill, type UnitCardData } from './cards'

/**
 * 牌少的种族补兵。第一批补侏儒、恶魔、血精灵、高等精灵、矮人、野兽。
 * 第二批把仍不满五张的再补上：侏儒、恶魔、血精灵各两张，高等精灵、野兽、暗夜精灵、元素各一张。
 * 第三批再补十张：元素两张，侏儒、恶魔、血精灵、高等精灵、野兽、矮人各一张，暗夜精灵两张。
 * 技能都用已经进战斗的种类。紫色传奇名气低于各大阵营领袖。
 */

/**
 * 侏儒技师。量产工程兵，火箭打中后溅到旁边。
 */
export const GNOME_TINKER_CARD: UnitCardData = {
  id: 'gnome-tinker',
  name: '侏儒技师',
  rarity: 'green',
  mark: '技',
  race: 'gnome',
  profession: '技师',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'physical',
  skills: [{ name: '集束火箭 1', effect: '普攻命中单位时，对目标相邻的其他敌方造成 1 点物理伤害', kind: 'splash', value: 1 }],
}

/**
 * 工匠大师格尔宾。紫色传奇，侏儒之王，名气低于萨尔、阿尔萨斯这些阵营领袖。
 * 火箭溅射，加速装置让范围内的友方行动更快，自己也算。
 */
export const MEKKATORQUE_CARD: UnitCardData = {
  id: 'mekkatorque',
  name: '工匠大师格尔宾',
  rarity: 'purple',
  mark: '格',
  race: 'gnome',
  profession: '技师',
  cd: 4,
  atk: 2,
  hp: 5,
  move: 2,
  speed: 2,
  range: 3,
  attackKind: 'physical',
  skills: [
    { name: '集束火箭 2', effect: '普攻命中单位时，对目标相邻的其他敌方造成 2 点物理伤害', kind: 'splash', value: 2 },
    { name: '加速装置 1', effect: '范围内友方（含自己）行动速度 +1', kind: 'aura', value: 1 },
  ],
}

/**
 * 地狱犬。恶魔猎犬，吞噬魔法只在打法师时加伤。
 */
export const FELHOUND_CARD: UnitCardData = {
  id: 'felhound',
  name: '地狱犬',
  rarity: 'green',
  mark: '犬',
  race: 'demon',
  profession: '地狱犬',
  cd: 2,
  atk: 2,
  hp: 4,
  move: 2,
  speed: 3,
  range: 1,
  attackKind: 'physical',
  skills: [{ name: '吞噬魔法 2', effect: '攻击法师时额外造成 2 点伤害', kind: 'feedback', value: 2 }],
}

/**
 * 末日守卫。燃烧军团的蓝卡近战。战争践踏打身边并让人少走，残废挂在普攻上。
 */
export const DOOM_GUARD_CARD: UnitCardData = {
  id: 'doom-guard',
  name: '末日守卫',
  rarity: 'blue',
  mark: '末',
  race: 'demon',
  profession: '末日守卫',
  cd: 3,
  atk: 3,
  hp: 7,
  move: 1,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    {
      name: '战争践踏 1',
      effect: '行动开始前，对相邻敌方造成 1 点法术伤害，并使其下次移动 -1（最低 1）。法术免疫可挡下',
      kind: 'thunderClap',
      value: 1,
    },
    {
      name: '残废 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/**
 * 龙鹰。血精灵的飞行坐骑兵，空中枷锁按减速结算。
 */
export const DRAGONHAWK_CARD: UnitCardData = {
  id: 'dragonhawk',
  name: '龙鹰',
  rarity: 'blue',
  mark: '鹰',
  race: 'bloodElf',
  profession: '龙鹰',
  cd: 2,
  atk: 2,
  hp: 4,
  move: 2,
  speed: 3,
  range: 3,
  attackKind: 'physical',
  skills: [
    { name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' },
    {
      name: '空中枷锁 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/**
 * 血骑士。银月城的重甲治疗者，卡名用兵种，不是传奇。
 */
export const BLOOD_KNIGHT_CARD: UnitCardData = {
  id: 'blood-knight',
  name: '血骑士',
  rarity: 'blue',
  mark: '血',
  race: 'bloodElf',
  profession: '圣骑士',
  cd: 3,
  atk: 2,
  hp: 6,
  move: 2,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    armorSkill('plate', 1),
    { name: '圣光术 2', effect: '行动开始前，为生命值最低的友方回复 2 点生命值', kind: 'heal', value: 2 },
  ],
}

/**
 * 高等精灵弓手。远射，重箭破一点甲。
 */
export const HIGH_ELF_ARCHER_CARD: UnitCardData = {
  id: 'high-elf-archer',
  name: '高等精灵弓手',
  rarity: 'green',
  mark: '高',
  race: 'highElf',
  profession: '弓手',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 1,
  speed: 2,
  range: 4,
  attackKind: 'physical',
  skills: [armorSkill('pierce', 1)],
}

/**
 * 游侠温蕾萨。紫色传奇，名气低于希尔瓦娜斯和奥蕾莉亚。多重射击溅到旁边，重箭破甲。
 */
export const VEREESA_CARD: UnitCardData = {
  id: 'vereesa',
  name: '游侠温蕾萨',
  rarity: 'purple',
  mark: '温',
  race: 'highElf',
  profession: '猎人',
  cd: 4,
  atk: 3,
  hp: 5,
  move: 2,
  speed: 3,
  range: 4,
  attackKind: 'physical',
  skills: [
    { name: '多重射击 1', effect: '普攻命中单位时，对目标相邻的其他敌方造成 1 点物理伤害', kind: 'splash', value: 1 },
    armorSkill('pierce', 1),
  ],
}

/**
 * 矮人猎手。铁炉堡的步枪手，打得远，重弹破一点甲。
 */
export const DWARF_HUNTER_CARD: UnitCardData = {
  id: 'dwarf-hunter',
  name: '矮人猎手',
  rarity: 'green',
  mark: '矮',
  race: 'dwarf',
  profession: '猎人',
  cd: 2,
  atk: 2,
  hp: 4,
  move: 1,
  speed: 2,
  range: 4,
  attackKind: 'physical',
  skills: [armorSkill('pierce', 1)],
}

/**
 * 奇美拉。暗夜精灵的攻城兽，按野兽归类。能飞，腐蚀吐息溅到目标旁边。
 */
export const CHIMAERA_CARD: UnitCardData = {
  id: 'chimaera',
  name: '奇美拉',
  rarity: 'blue',
  mark: '奇',
  race: 'beast',
  profession: '奇美拉',
  cd: 3,
  atk: 3,
  hp: 6,
  move: 2,
  speed: 2,
  range: 3,
  attackKind: 'physical',
  skills: [
    { name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' },
    { name: '腐蚀吐息 2', effect: '普攻命中单位时，对目标相邻的其他敌方造成 2 点物理伤害', kind: 'splash', value: 2 },
  ],
}

/**
 * 侏儒修理兵。给最虚弱的友方修一点血，自己几乎不打架。
 */
export const GNOME_REPAIR_CARD: UnitCardData = {
  id: 'gnome-repair',
  name: '侏儒修理兵',
  rarity: 'green',
  mark: '修',
  race: 'gnome',
  profession: '修理兵',
  cd: 2,
  atk: 1,
  hp: 4,
  move: 1,
  speed: 2,
  range: 2,
  attackKind: 'physical',
  skills: [{ name: '修理 2', effect: '行动开始前，为生命值最低的友方回复 2 点生命值', kind: 'heal', value: 2 }],
}

/**
 * 法师米尔豪斯。紫色传奇，侏儒法师，名气低于吉安娜和瓦格斯。
 * 奥术飞弹打一个随机敌人，普攻再挂减速。
 */
export const MILLHOUSE_CARD: UnitCardData = {
  id: 'millhouse',
  name: '法师米尔豪斯',
  rarity: 'purple',
  mark: '米',
  race: 'gnome',
  profession: '法师',
  cd: 4,
  atk: 2,
  hp: 4,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '奥术飞弹 2', effect: '对随机一个敌方造成 2 点法术伤害', kind: 'lightning', value: 2 },
    {
      name: '减速 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/**
 * 恶魔卫士。燃烧军团的持盾步兵，把人吸到自己身上，再靠重甲硬扛。
 */
export const FEL_GUARD_CARD: UnitCardData = {
  id: 'fel-guard',
  name: '恶魔卫士',
  rarity: 'blue',
  mark: '卫',
  race: 'demon',
  profession: '卫士',
  cd: 3,
  atk: 3,
  hp: 7,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '嘲讽', effect: '敌方会优先靠近并攻击这名单位', kind: 'taunt' },
    armorSkill('plate', 1),
  ],
}

/**
 * 魅魔。远程诱惑，按减速结算，自己很脆。
 */
export const SUCCUBUS_CARD: UnitCardData = {
  id: 'succubus',
  name: '魅魔',
  rarity: 'green',
  mark: '魅',
  race: 'demon',
  profession: '魅魔',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 2,
  speed: 3,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '诱惑 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/**
 * 魔导师。银月城的奥术师，飞弹打随机敌人，法术穿透用来打魔甲。
 */
export const MAGISTER_CARD: UnitCardData = {
  id: 'magister',
  name: '魔导师',
  rarity: 'blue',
  mark: '导',
  race: 'bloodElf',
  profession: '法师',
  cd: 3,
  atk: 3,
  hp: 3,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '奥术飞弹 2', effect: '对随机一个敌方造成 2 点法术伤害', kind: 'lightning', value: 2 },
    armorSkill('spellPierce', 1),
  ],
}

/**
 * 远行者。血精灵游侠，箭矢打中后溅到旁边。
 */
export const FARSTRIDER_CARD: UnitCardData = {
  id: 'farstrider',
  name: '远行者',
  rarity: 'green',
  mark: '远',
  race: 'bloodElf',
  profession: '弓手',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 1,
  speed: 2,
  range: 4,
  attackKind: 'physical',
  skills: [{ name: '多重射击 1', effect: '普攻命中单位时，对目标相邻的其他敌方造成 1 点物理伤害', kind: 'splash', value: 1 }],
}

/**
 * 高等精灵剑士。轻装近战，先跑再砍会更疼，没有重甲。
 */
export const HIGH_ELF_SWORDSMAN_CARD: UnitCardData = {
  id: 'high-elf-swordsman',
  name: '高等精灵剑士',
  rarity: 'green',
  mark: '剑',
  race: 'highElf',
  profession: '剑士',
  cd: 2,
  atk: 2,
  hp: 4,
  move: 2,
  speed: 3,
  range: 1,
  attackKind: 'physical',
  skills: [{ name: '冲锋 1', effect: '本回合移动后再攻击时，额外造成 1 点伤害', kind: 'charge', value: 1 }],
}

/**
 * 角鹰兽。能飞的野兽，攻击不高，用来越过河流和石头。
 */
export const HIPPOGRYPH_CARD: UnitCardData = {
  id: 'hippogryph',
  name: '角鹰兽',
  rarity: 'green',
  mark: '角',
  race: 'beast',
  profession: '角鹰兽',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 2,
  speed: 3,
  range: 2,
  attackKind: 'physical',
  skills: [{ name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' }],
}

/**
 * 火元素。类型行单独成元素，不进人类。行动时烧身边一格，自己用法术打人。
 */
export const FIRE_ELEMENTAL_CARD: UnitCardData = {
  id: 'fire-elemental',
  name: '火元素',
  rarity: 'blue',
  mark: '炎',
  race: 'human',
  profession: '元素',
  cd: 2,
  atk: 3,
  hp: 4,
  move: 1,
  speed: 2,
  range: 2,
  attackKind: 'spell',
  skills: [{ name: '献祭 1', effect: '行动开始时，对相邻敌方造成 1 点法术伤害。法术免疫可挡下', kind: 'immolate', value: 1 }],
}

/**
 * 树妖。暗夜精灵的魔法免疫射手，毒矛按减速结算。
 */
export const DRYAD_CARD: UnitCardData = {
  id: 'dryad',
  name: '树妖',
  rarity: 'blue',
  mark: '树',
  race: 'nightElf',
  profession: '树妖',
  cd: 2,
  atk: 2,
  hp: 4,
  move: 2,
  speed: 3,
  range: 3,
  attackKind: 'physical',
  skills: [
    { name: '法术免疫', effect: '受到的法术伤害变为 0，也不受减速、变形、风暴之锤和雷霆一击影响', kind: 'spellImmune' },
    {
      name: '毒矛 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
  ],
}

/**
 * 发条机器人。侏儒做的近战机械，锯子打中后溅到旁边，自己有一层甲。
 */
export const CLOCKWERK_CARD: UnitCardData = {
  id: 'clockwerk',
  name: '发条机器人',
  rarity: 'green',
  mark: '钟',
  race: 'gnome',
  profession: '机械',
  cd: 2,
  atk: 2,
  hp: 5,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    armorSkill('plate', 1),
    { name: '圆锯 1', effect: '普攻命中单位时，对目标相邻的其他敌方造成 1 点物理伤害', kind: 'splash', value: 1 },
  ],
}

/**
 * 恐惧魔王。燃烧军团的将领里偏弱的一档，近战吸血，腐臭打一个随机敌人。
 */
export const DREADLORD_CARD: UnitCardData = {
  id: 'dreadlord',
  name: '恐惧魔王',
  rarity: 'blue',
  mark: '恐',
  race: 'demon',
  profession: '恐惧魔王',
  cd: 3,
  atk: 3,
  hp: 7,
  move: 1,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '吸血 1', effect: '普攻命中单位后，为自己回复 1 点生命，不超过上限', kind: 'leech', value: 1 },
    { name: '腐臭蜂群 2', effect: '对随机一个敌方造成 2 点法术伤害', kind: 'lightning', value: 2 },
  ],
}

/**
 * 奥术傀儡。血精灵的魔法构造体，魔甲挡法术，反馈专门打法师。
 */
export const ARCANE_GOLEM_CARD: UnitCardData = {
  id: 'arcane-golem',
  name: '奥术傀儡',
  rarity: 'blue',
  mark: '傀',
  race: 'bloodElf',
  profession: '傀儡',
  cd: 3,
  atk: 2,
  hp: 6,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    armorSkill('ward', 1),
    { name: '反馈 2', effect: '攻击法师时额外造成 2 点伤害', kind: 'feedback', value: 2 },
  ],
}

/**
 * 高等精灵祭司。治疗最虚弱的友方，自己有一层魔甲。类型行带法师，反馈会打到。
 */
export const HIGH_ELF_PRIEST_CARD: UnitCardData = {
  id: 'high-elf-priest',
  name: '高等精灵祭司',
  rarity: 'green',
  mark: '祭',
  race: 'highElf',
  profession: '祭司',
  cd: 2,
  atk: 1,
  hp: 3,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '治疗 2', effect: '行动开始前，为生命值最低的友方回复 2 点生命值', kind: 'heal', value: 2 },
    armorSkill('ward', 1),
  ],
}

/**
 * 雷霆蜥蜴。大型野兽，先踩一圈身边的人。
 */
export const THUNDER_LIZARD_CARD: UnitCardData = {
  id: 'thunder-lizard',
  name: '雷霆蜥蜴',
  rarity: 'blue',
  mark: '霆',
  race: 'beast',
  profession: '雷霆蜥蜴',
  cd: 3,
  atk: 3,
  hp: 8,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    {
      name: '雷霆一击 1',
      effect: '行动开始前，对相邻敌方造成 1 点法术伤害，并使其下次移动 -1（最低 1）。法术免疫可挡下',
      kind: 'thunderClap',
      value: 1,
    },
  ],
}

/**
 * 巡山人。铁炉堡的矮人步哨，穿着甲，风暴之锤打最近的人并打断行动。
 */
export const MOUNTAINEER_CARD: UnitCardData = {
  id: 'mountaineer',
  name: '巡山人',
  rarity: 'blue',
  mark: '巡',
  race: 'dwarf',
  profession: '战士',
  cd: 3,
  atk: 2,
  hp: 6,
  move: 1,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    armorSkill('plate', 1),
    {
      name: '风暴之锤 1',
      effect: '行动开始前，对最近的敌方造成 1 点法术伤害，并取消其本回合剩余行动。法术免疫可挡下',
      kind: 'stormBolt',
      value: 1,
    },
  ],
}

/**
 * 投刃车。暗夜精灵的攻城器械，打建筑更疼，刀刃还会溅到旁边。
 */
export const GLAIVE_THROWER_CARD: UnitCardData = {
  id: 'glaive-thrower',
  name: '投刃车',
  rarity: 'blue',
  mark: '刃',
  race: 'nightElf',
  profession: '攻城',
  cd: 3,
  atk: 3,
  hp: 3,
  move: 1,
  speed: 1,
  range: 4,
  attackKind: 'physical',
  skills: [
    { name: '投刃 2', effect: '攻击大本营时额外造成 2 点伤害', kind: 'siege', value: 2 },
    { name: '弹射 1', effect: '普攻命中单位时，对目标相邻的其他敌方造成 1 点物理伤害', kind: 'splash', value: 1 },
  ],
}

/**
 * 精灵龙。暗夜精灵的小飞龙，能飞，法力闪耀按反馈打法师。
 */
export const FAERIE_DRAGON_CARD: UnitCardData = {
  id: 'faerie-dragon',
  name: '精灵龙',
  rarity: 'green',
  mark: '灵',
  race: 'nightElf',
  profession: '精灵龙',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 2,
  speed: 3,
  range: 3,
  attackKind: 'physical',
  skills: [
    { name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' },
    { name: '法力闪耀 1', effect: '攻击法师时额外造成 1 点伤害', kind: 'feedback', value: 1 },
  ],
}

/**
 * 土元素。类型行单独成元素。站到前面吃攻击，自己有一层重甲。
 */
export const EARTH_ELEMENTAL_CARD: UnitCardData = {
  id: 'earth-elemental',
  name: '土元素',
  rarity: 'blue',
  mark: '土',
  race: 'human',
  profession: '元素',
  cd: 3,
  atk: 2,
  hp: 8,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '嘲讽', effect: '敌方会优先靠近并攻击这名单位', kind: 'taunt' },
    armorSkill('plate', 1),
  ],
}

/**
 * 空气元素。类型行单独成元素。能飞，再打一个随机敌人。
 */
export const AIR_ELEMENTAL_CARD: UnitCardData = {
  id: 'air-elemental',
  name: '空气元素',
  rarity: 'green',
  mark: '气',
  race: 'human',
  profession: '元素',
  cd: 2,
  atk: 2,
  hp: 3,
  move: 2,
  speed: 3,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' },
    { name: '闪电 1', effect: '对随机一个敌方造成 1 点法术伤害', kind: 'lightning', value: 1 },
  ],
}

/** 补进图鉴的牌。不含召唤物 */
export const SIDE_RACE_CARDS: readonly UnitCardData[] = [
  GNOME_TINKER_CARD,
  MEKKATORQUE_CARD,
  GNOME_REPAIR_CARD,
  MILLHOUSE_CARD,
  FELHOUND_CARD,
  DOOM_GUARD_CARD,
  FEL_GUARD_CARD,
  SUCCUBUS_CARD,
  DRAGONHAWK_CARD,
  BLOOD_KNIGHT_CARD,
  MAGISTER_CARD,
  FARSTRIDER_CARD,
  HIGH_ELF_ARCHER_CARD,
  VEREESA_CARD,
  HIGH_ELF_SWORDSMAN_CARD,
  DWARF_HUNTER_CARD,
  CHIMAERA_CARD,
  HIPPOGRYPH_CARD,
  FIRE_ELEMENTAL_CARD,
  EARTH_ELEMENTAL_CARD,
  AIR_ELEMENTAL_CARD,
  DRYAD_CARD,
  CLOCKWERK_CARD,
  DREADLORD_CARD,
  ARCANE_GOLEM_CARD,
  HIGH_ELF_PRIEST_CARD,
  THUNDER_LIZARD_CARD,
  MOUNTAINEER_CARD,
  GLAIVE_THROWER_CARD,
  FAERIE_DRAGON_CARD,
]
