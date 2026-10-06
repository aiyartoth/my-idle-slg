import type { CardSkill, UnitCardData } from './cards'

/**
 * 魔兽世界出名人物做成的橙色传奇生物。
 * 名字尽量带称号前缀。召唤物是白卡，不进牌库，只在场上被召出来。
 * 数值对齐山丘之王和张角：冷却 5，单次伤害以 2 为主。
 */

/** 幽灵狼。萨尔补到场上两只为止，自己没有技能 */
export const GHOST_WOLF_CARD: UnitCardData = {
  id: 'ghost-wolf',
  name: '幽灵狼',
  rarity: 'white',
  mark: '狼',
  race: 'beast',
  profession: '野兽',
  cd: 1,
  atk: 2,
  hp: 3,
  move: 2,
  speed: 3,
  range: 1,
  attackKind: 'physical',
  skills: [],
}

/** 食尸鬼。阿尔萨斯击杀后留在死者的格子上 */
export const GHOUL_CARD: UnitCardData = {
  id: 'ghoul',
  name: '食尸鬼',
  rarity: 'white',
  mark: '尸',
  race: 'undead',
  profession: '食尸鬼',
  cd: 1,
  atk: 2,
  hp: 3,
  move: 2,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [],
}

/** 女妖。希尔瓦娜斯击杀后最多留一只 */
export const BANSHEE_CARD: UnitCardData = {
  id: 'banshee',
  name: '女妖',
  rarity: 'white',
  mark: '妖',
  race: 'undead',
  profession: '女妖',
  cd: 1,
  atk: 2,
  hp: 2,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [],
}

/** 地狱火。紫色恶魔，站前面吃攻击，行动开始时烧身边一格 */
export const INFERNAL_CARD: UnitCardData = {
  id: 'infernal',
  name: '地狱火',
  rarity: 'purple',
  mark: '狱',
  race: 'demon',
  profession: '恶魔',
  cd: 1,
  atk: 4,
  hp: 8,
  move: 1,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '嘲讽', effect: '敌方会优先靠近并攻击这名单位', kind: 'taunt' },
    { name: '献祭 1', effect: '行动开始时，对相邻敌方造成 1 点法术伤害。法术免疫可挡下', kind: 'immolate', value: 1 },
  ],
}

/** 凤凰蛋的孵化。先占位，凤凰定义完再把变回去的牌填上 */
const PHOENIX_HATCH: CardSkill = {
  name: '孵化',
  effect: '不能移动，也不攻击。熬过 3 个回合开始后变为凤凰',
  kind: 'hatch',
  value: 3,
}

/** 凤凰蛋。凤凰死亡后留在原地，活过三个回合才变回凤凰 */
export const PHOENIX_EGG_CARD: UnitCardData = {
  id: 'phoenix-egg',
  name: '凤凰蛋',
  rarity: 'white',
  mark: '蛋',
  race: 'bloodElf',
  profession: '凤凰',
  cd: 1,
  atk: 0,
  hp: 5,
  move: 0,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [PHOENIX_HATCH],
}

/** 凤凰。紫色飞行单位。死亡时留下凤凰蛋，蛋活过三个回合再变回凤凰 */
export const PHOENIX_CARD: UnitCardData = {
  id: 'phoenix',
  name: '凤凰',
  rarity: 'purple',
  mark: '凰',
  race: 'bloodElf',
  profession: '凤凰',
  cd: 1,
  atk: 3,
  hp: 6,
  move: 2,
  speed: 3,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '飞行', effect: '移动可以经过河流和石头', kind: 'fly' },
    {
      name: '重生',
      effect: '死亡时在原地留下一只不能移动的凤凰蛋。凤凰蛋熬过 3 个回合开始后变回凤凰',
      kind: 'rebirth',
      value: 3,
      summons: [PHOENIX_EGG_CARD],
    },
  ],
}

PHOENIX_HATCH.summons = [PHOENIX_CARD]

/** 米莎。蓝色的熊，会概率打晕人，变形和吞噬都拿她没办法 */
export const MISHA_CARD: UnitCardData = {
  id: 'misha',
  name: '米莎',
  rarity: 'blue',
  mark: '熊',
  race: 'beast',
  profession: '野兽',
  cd: 1,
  atk: 2,
  hp: 6,
  move: 1,
  speed: 1,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '嘲讽', effect: '敌方会优先靠近并攻击这名单位', kind: 'taunt' },
    { name: '猛锤', effect: '普攻命中后，有 50% 概率使目标失去一回合行动', kind: 'maul', value: 50 },
    { name: '抗性皮肤', effect: '不受变形术和吞噬影响', kind: 'resist' },
  ],
}

/**
 * 先知萨尔。补两只幽灵狼，闪电链按距离最近跳，最多三个目标。
 */
export const THRALL_CARD: UnitCardData = {
  id: 'thrall',
  name: '先知萨尔',
  rarity: 'orange',
  mark: '萨',
  race: 'orc',
  profession: '萨满',
  cd: 5,
  atk: 2,
  hp: 6,
  move: 2,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '幽灵狼 2',
      effect: '回合开始时，在周围空格召唤幽灵狼，直到场上自己的幽灵狼有两只',
      kind: 'pack',
      value: 2,
      summons: [GHOST_WOLF_CARD],
    },
    {
      name: '闪电链 2',
      effect: '行动开始前，对最近的敌方造成 2 点法术伤害，再跳到该目标两格内最近的另一个敌方，最多三个目标。法术免疫可挡下',
      kind: 'chain',
      value: 2,
    },
  ],
}

/**
 * 灰烬使者莫格莱尼。普攻溅射，圣盾每回合抵消下一次伤害。
 */
export const MOGRAINE_CARD: UnitCardData = {
  id: 'mograine',
  name: '灰烬使者莫格莱尼',
  rarity: 'orange',
  mark: '烬',
  race: 'human',
  profession: '圣骑士',
  cd: 5,
  atk: 3,
  hp: 8,
  move: 2,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '灰烬使者 2', effect: '普攻命中单位时，对目标相邻的其他敌方造成 2 点物理伤害', kind: 'splash', value: 2 },
    { name: '圣盾术', effect: '召唤上场时，以及之后每个回合开始时获得圣盾。圣盾抵消下一次受到的伤害，然后消失', kind: 'aegis' },
  ],
}

/**
 * 巫妖王阿尔萨斯。普攻减速，击杀后在该格召食尸鬼，最多两只。
 */
export const ARTHAS_CARD: UnitCardData = {
  id: 'arthas',
  name: '巫妖王阿尔萨斯',
  rarity: 'orange',
  mark: '巫',
  race: 'undead',
  profession: '死亡骑士',
  cd: 5,
  atk: 3,
  hp: 9,
  move: 2,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    {
      name: '霜之哀伤 1',
      effect: '普攻命中后，目标下次移动 -1（最低 1）。若减速留到下回合开始，行动速度也 -1（最低 1），行动后消失',
      kind: 'slow',
      value: 1,
    },
    {
      name: '亡者复生',
      effect: '普攻击杀敌方单位后，在该格召唤一只食尸鬼。场上自己的食尸鬼最多两只',
      kind: 'raise',
      value: 2,
      summons: [GHOUL_CARD],
    },
  ],
}

/**
 * 背叛者伊利丹。先打身边，再追后排，移动后再砍一刀更疼。
 */
export const ILLIDAN_CARD: UnitCardData = {
  id: 'illidan',
  name: '背叛者伊利丹',
  rarity: 'orange',
  mark: '伊',
  race: 'nightElf',
  profession: '恶魔猎手',
  cd: 5,
  atk: 4,
  hp: 6,
  move: 3,
  speed: 4,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '刃舞 2', effect: '行动开始前，对相邻敌方造成 2 点物理伤害', kind: 'whirl', value: 2 },
    { name: '恶魔追猎 2', effect: '优先追击后方的敌人。本回合移动后再攻击时，额外造成 2 点伤害', kind: 'hunt', value: 2 },
  ],
}

/**
 * 大法师吉安娜。先冻住身边的人，普攻打已经减速的目标时更疼。
 */
export const JAINA_CARD: UnitCardData = {
  id: 'jaina',
  name: '大法师吉安娜',
  rarity: 'orange',
  mark: '吉',
  race: 'human',
  profession: '法师',
  cd: 5,
  atk: 3,
  hp: 5,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '冰霜新星 1',
      effect: '行动开始前，对相邻敌方造成 1 点法术伤害，并使其下次移动 -1（最低 1）。法术免疫可挡下',
      kind: 'thunderClap',
      value: 1,
    },
    { name: '冰枪术 2', effect: '普攻命中已处于减速的单位时，额外造成 2 点法术伤害', kind: 'shatter', value: 2 },
  ],
}

/**
 * 女妖之王希尔瓦娜斯。普攻打断行动，击杀后留下一只女妖。
 */
export const SYLVANAS_CARD: UnitCardData = {
  id: 'sylvanas',
  name: '女妖之王希尔瓦娜斯',
  rarity: 'orange',
  mark: '希',
  race: 'undead',
  profession: '游侠',
  cd: 5,
  atk: 3,
  hp: 4,
  move: 2,
  speed: 3,
  range: 4,
  attackKind: 'physical',
  skills: [
    { name: '沉默射击', effect: '普攻命中后，取消目标本回合剩余行动', kind: 'bash' },
    {
      name: '黑箭',
      effect: '普攻击杀敌方单位后，在该格召唤一只女妖。场上自己的女妖最多一只',
      kind: 'raise',
      value: 1,
      summons: [BANSHEE_CARD],
    },
  ],
}

/**
 * 月神祭司泰兰德。先给每个友方回复 1 点，再对射程内的敌人落下星辰。
 */
export const TYRANDE_CARD: UnitCardData = {
  id: 'tyrande',
  name: '月神祭司泰兰德',
  rarity: 'orange',
  mark: '月',
  race: 'nightElf',
  profession: '祭司',
  cd: 5,
  atk: 2,
  hp: 6,
  move: 2,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    { name: '宁静 1', effect: '行动开始前，为每个友方回复 1 点生命，不超过各自上限', kind: 'massHeal', value: 1 },
    { name: '星辰坠落 2', effect: '行动开始前，对范围内所有敌方造成 2 点法术伤害', kind: 'blizzard', value: 2 },
  ],
}

/**
 * 污染者古尔丹。补一只地狱火，再抽自己一点血去打最近的敌人。
 */
export const GULDAN_CARD: UnitCardData = {
  id: 'guldan',
  name: '污染者古尔丹',
  rarity: 'orange',
  mark: '污',
  race: 'orc',
  profession: '术士',
  cd: 5,
  atk: 2,
  hp: 5,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '地狱火',
      effect: '回合开始时，在周围空格召唤一只地狱火。场上自己的地狱火最多一只',
      kind: 'pack',
      value: 1,
      summons: [INFERNAL_CARD],
    },
    {
      name: '生命分流 2',
      effect: '行动开始前，若自己生命至少为 2，且场上有敌方，对自己造成 1 点伤害，再对最近的敌方造成 2 点法术伤害',
      kind: 'tap',
      value: 2,
    },
  ],
}

/**
 * 太阳之王凯尔萨斯。炎爆先打最近的人，击杀后再跳一下。死亡时留下凤凰。
 */
export const KAELTHAS_CARD: UnitCardData = {
  id: 'kaelthas',
  name: '太阳之王凯尔萨斯',
  rarity: 'orange',
  mark: '日',
  race: 'bloodElf',
  profession: '血法师',
  cd: 5,
  atk: 3,
  hp: 4,
  move: 1,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '炎爆术 3',
      effect: '行动开始前，对最近的敌方造成 3 点法术伤害。若该目标因此死亡，对两格内最近的另一个敌方造成 2 点法术伤害',
      kind: 'pyro',
      value: 3,
      follow: 2,
    },
    { name: '凤凰', effect: '自身死亡时，在原地召唤一只凤凰。凤凰死亡后不再召唤', kind: 'rebirth', summons: [PHOENIX_CARD] },
  ],
}

/**
 * 兽王雷克萨。补一只米莎。米莎在场时，这一次普攻更疼。
 */
export const REXXAR_CARD: UnitCardData = {
  id: 'rexxar',
  name: '兽王雷克萨',
  rarity: 'orange',
  mark: '兽',
  race: 'orc',
  profession: '猎人',
  cd: 5,
  atk: 3,
  hp: 5,
  move: 2,
  speed: 3,
  range: 3,
  attackKind: 'physical',
  skills: [
    {
      name: '召唤米莎',
      effect: '回合开始时，在周围空格召唤米莎。场上自己的米莎最多一只',
      kind: 'pack',
      value: 1,
      summons: [MISHA_CARD],
    },
    { name: '杀戮命令 2', effect: '场上有自己的米莎时，本次普攻额外造成 2 点伤害', kind: 'command', value: 2, summons: [MISHA_CARD] },
  ],
}

/** 十张传奇生物。图鉴按这个顺序放在召唤物前面 */
export const LEGEND_CARDS: readonly UnitCardData[] = [
  THRALL_CARD,
  MOGRAINE_CARD,
  ARTHAS_CARD,
  ILLIDAN_CARD,
  JAINA_CARD,
  SYLVANAS_CARD,
  TYRANDE_CARD,
  GULDAN_CARD,
  KAELTHAS_CARD,
  REXXAR_CARD,
]

/** 传奇生物召出来的单位。和图鉴放在一起，方便查看面板 */
export const LEGEND_TOKEN_CARDS: readonly UnitCardData[] = [
  GHOST_WOLF_CARD,
  GHOUL_CARD,
  BANSHEE_CARD,
  INFERNAL_CARD,
  PHOENIX_CARD,
  PHOENIX_EGG_CARD,
  MISHA_CARD,
]
