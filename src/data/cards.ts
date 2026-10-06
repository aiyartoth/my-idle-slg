/** 卡牌稀有度。从低到高是白、绿、蓝、紫、橙、红 */
export type CardRarity = 'white' | 'green' | 'blue' | 'purple' | 'orange' | 'red'

/** 稀有度的中文名，卡面和背包都用这一套 */
export const RARITY_LABEL: Record<CardRarity, string> = {
  /** 普通 */
  white: '白',
  /** 优秀 */
  green: '绿',
  /** 精良 */
  blue: '蓝',
  /** 史诗 */
  purple: '紫',
  /** 传说 */
  orange: '橙',
  /** 神话 */
  red: '红',
}

/**
 * 稀有度对应的名字颜色。卡面和背包都是浅底，白用深灰，避免白字看不见。
 */
export const RARITY_TEXT_CLASS: Record<CardRarity, string> = {
  /** 深灰，浅底上仍能读出「白」 */
  white: 'text-[#6b6560]',
  /** 绿 */
  green: 'text-[#178a3d]',
  /** 蓝 */
  blue: 'text-[#1a6cb8]',
  /** 紫 */
  purple: 'text-[#7b35b0]',
  /** 橙 */
  orange: 'text-[#c25a00]',
  /** 红 */
  red: 'text-[#c62828]',
}

/** 深底上的稀有度名字颜色。战斗日志和召唤队列是深底，白用浅色才看得见 */
export const RARITY_TEXT_ON_DARK_CLASS: Record<CardRarity, string> = {
  /** 浅色，深底上仍能读出「白」 */
  white: 'text-[#f4efe6]',
  /** 绿 */
  green: 'text-[#5dce7a]',
  /** 蓝 */
  blue: 'text-[#6eb6ef]',
  /** 紫 */
  purple: 'text-[#c792ea]',
  /** 橙 */
  orange: 'text-[#f0a04a]',
  /** 红 */
  red: 'text-[#f07a7a]',
}

/** 卡牌模块左侧色条，和名字用同一套稀有度 */
export const RARITY_EDGE_CLASS: Record<CardRarity, string> = {
  /** 白 */
  white: 'border-[#6b6560]',
  /** 绿 */
  green: 'border-[#178a3d]',
  /** 蓝 */
  blue: 'border-[#1a6cb8]',
  /** 紫 */
  purple: 'border-[#7b35b0]',
  /** 橙 */
  orange: 'border-[#c25a00]',
  /** 红 */
  red: 'border-[#c62828]',
}

/** 按卡牌 id 用当前稀有度。改配置后，旧档里这几张牌也会跟着变。黄巾兵沿用对应基础兵 */
const RARITY_BY_ID: Record<string, CardRarity> = {
  /** 步兵、黄巾步兵、水元素 */
  infantry: 'white',
  'yellow-infantry': 'white',
  'water-elemental': 'white',
  /** 弓箭手、黄巾弓箭手、火枪手、法师 */
  archer: 'green',
  'yellow-archer': 'green',
  musketeer: 'green',
  mage: 'green',
  /** 重甲步兵、魔卫 */
  'heavy-infantry': 'blue',
  'ward-guard': 'blue',
  /** 圣殿骑士、大法师瓦格斯 */
  'temple-knight': 'purple',
  archmage: 'purple',
  /** 天公将军张角、山丘之王穆拉丁 */
  'zhang-jiao': 'orange',
  'mountain-king': 'orange',
  /** 牧师、飞行器、猎人 */
  priest: 'green',
  'flying-machine': 'green',
  hunter: 'green',
  /** 骑士、女巫、破法者、迫击炮小队、攻城器械、狮鹫骑士 */
  knight: 'blue',
  sorceress: 'blue',
  'spell-breaker': 'blue',
  'mortar-team': 'blue',
  'siege-engine': 'blue',
  'gryphon-rider': 'blue',
  /** 战士、潜行者、暗影牧师、冰霜法师、术士 */
  warrior: 'blue',
  rogue: 'blue',
  'shadow-priest': 'blue',
  'frost-mage': 'blue',
  warlock: 'blue',
  /** 圣骑士加文拉德、萨满德雷克塔尔、德鲁伊纳拉雷克斯 */
  paladin: 'purple',
  shaman: 'purple',
  druid: 'purple',
  /** 死亡骑士达里安 */
  'death-knight': 'orange',
  /** 魔兽传奇生物。召唤物是白 */
  thrall: 'orange',
  mograine: 'orange',
  arthas: 'orange',
  illidan: 'orange',
  jaina: 'orange',
  sylvanas: 'orange',
  tyrande: 'orange',
  guldan: 'orange',
  kaelthas: 'orange',
  rexxar: 'orange',
  'ghost-wolf': 'white',
  ghoul: 'white',
  banshee: 'white',
  infernal: 'purple',
  phoenix: 'purple',
  'phoenix-egg': 'white',
  misha: 'blue',
  /** 魔兽争霸 3 战役兵。骷髅是亡灵巫师召出来的 */
  grunt: 'green',
  raider: 'green',
  'witch-doctor': 'green',
  huntress: 'green',
  tauren: 'blue',
  kodo: 'blue',
  abomination: 'blue',
  necromancer: 'blue',
  'frost-wyrm': 'purple',
  'mountain-giant': 'purple',
  skeleton: 'white',
}

/**
 * 按当前配置补上稀有度。认识的牌以配置为准，不认识的沿用存档，再没有就记为白。
 *
 * @param card 存档或配置里的单位卡
 * @returns 带稀有度的单位卡
 */
export function ensureCardRarity(card: UnitCardData): UnitCardData {
  const rarity = RARITY_BY_ID[card.id] ?? (isCardRarity(card.rarity) ? card.rarity : 'white')
  if (card.rarity === rarity) return card
  return { ...card, rarity }
}

/**
 * 判断一个值是不是六种稀有度之一。
 *
 * @param value 存档里读出的字段
 * @returns 是稀有度时为 true
 */
function isCardRarity(value: unknown): value is CardRarity {
  return value === 'white' || value === 'green' || value === 'blue' || value === 'purple' || value === 'orange' || value === 'red'
}

/** 卡牌种族。人类阵营里再分人类、矮人、侏儒和高等精灵，传奇生物再用兽人、亡灵、暗夜、血精灵、野兽和恶魔 */
export type CardRace = 'human' | 'dwarf' | 'gnome' | 'highElf' | 'orc' | 'undead' | 'nightElf' | 'bloodElf' | 'beast' | 'demon'

/** 种族写在卡面类型行上的名字 */
export const RACE_LABEL: Record<CardRace, string> = {
  /** 人类 */
  human: '人类',
  /** 矮人 */
  dwarf: '矮人',
  /** 侏儒 */
  gnome: '侏儒',
  /** 高等精灵 */
  highElf: '高等精灵',
  /** 兽人 */
  orc: '兽人',
  /** 亡灵 */
  undead: '亡灵',
  /** 暗夜精灵 */
  nightElf: '暗夜精灵',
  /** 血精灵 */
  bloodElf: '血精灵',
  /** 野兽。幽灵狼和米莎用 */
  beast: '野兽',
  /** 恶魔。地狱火用 */
  demon: '恶魔',
}

/** 伤害种类。物理伤害吃重甲，法术伤害吃魔甲 */
export type AttackKind = 'physical' | 'spell'

/** 一条技能。卡面写成「名字 ~ 效果」，整行左对齐。没进战斗的，最前面标未实现 */
export interface CardSkill {
  /** 技能名 */
  name: string
  /** 具体效果 */
  effect: string
  /** 护甲、穿透、治疗、警戒、撒豆成兵或雷电。普通文案技能可以不填 */
  kind?: SkillKind
  /** 和种类一起用的点数。雷电这里是法术伤害的基础值 */
  value?: number
  /** 击杀后跳到下一目标的伤害。炎爆术用来跟第一下的点数区分 */
  follow?: number
  /** 撒豆成兵可以召出来的单位。每次召唤从里面随机取一张 */
  summons?: readonly UnitCardData[]
  /** 战斗还没结算这条技能。卡面上写在名字前面 */
  unimplemented?: boolean
}

/** 卡面上给没进战斗的技能用的标记，写在技能名前面 */
export const UNIMPLEMENTED_SKILL_MARK = '未实现'

/**
 * 卡面上的一行技能。没实现的把标记放在最前面。
 *
 * @param skill 一条技能
 * @returns 名字、效果，以及必要时的未实现标记
 */
export function skillLine(skill: CardSkill): string {
  const body = `${skill.name} ~ ${skill.effect}`
  return skill.unimplemented ? `${UNIMPLEMENTED_SKILL_MARK} ${body}` : body
}

/** 单位卡。列表按名字、种类职业、冷却、攻防、移动、范围读，技能另起一行 */
export interface UnitCardData {
  id: string
  /** 卡名 */
  name: string
  /** 稀有度。决定卡面名字和背包名字的颜色 */
  rarity: CardRarity
  /** 棋盘上的短标，用来和同名兵种区分 */
  mark: string
  race: CardRace
  /** 职业 */
  profession: string
  /** 冷却。手牌在回合开始时减 1，到 0 才能召唤 */
  cd: number
  /** 攻击 */
  atk: number
  /** 血量，攻防行里和攻击一起显示 */
  hp: number
  /** 每回合沿上下左右最多走的格数 */
  move: number
  /** 行动速度。高的先移动；相同则先上场的先动，同一批上场时我方先动 */
  speed: number
  /** 攻击范围，按上下左右的步数计算 */
  range: number
  attackKind: AttackKind
  /** 技能。空数组表示没有技能，列表不展开效果 */
  skills: readonly CardSkill[]
}

/** 护甲和穿透的种类。点数写进技能名，效果句按种类生成，避免两处数字对不上 */
export type ArmorSkillKind = 'pierce' | 'spellPierce' | 'plate' | 'ward'

/**
 * 战斗里按种类识别的技能。
 * 护甲四种、法术免疫和反馈会改伤害。
 * 斩杀按目标当前生命加到这一击上。吸血在命中后回复自己。
 * 战鼓给范围内友方的普攻加上攻击，自己也算。
 * 吞噬和斩杀一样按目标当前生命追加伤害，但飞行、传奇、抗性皮肤和法术免疫吃不到吞噬。
 * 其余种类各自有行动、走位或选目标结算，不写进普攻公式。
 */
export type SkillKind =
  | ArmorSkillKind
  | 'heal'
  | 'vigilance'
  | 'bean'
  | 'lightning'
  | 'charge'
  | 'innerFire'
  | 'slow'
  | 'polymorph'
  | 'spellImmune'
  | 'feedback'
  | 'splash'
  | 'siege'
  | 'fly'
  | 'blizzard'
  | 'aura'
  | 'stormBolt'
  | 'thunderClap'
  | 'bash'
  | 'execute'
  | 'leech'
  | 'taunt'
  | 'pack'
  | 'chain'
  | 'aegis'
  | 'raise'
  | 'rebirth'
  | 'massHeal'
  | 'shatter'
  | 'tap'
  | 'command'
  | 'whirl'
  | 'hunt'
  | 'pyro'
  | 'drums'
  | 'immolate'
  | 'maul'
  | 'devour'
  | 'resist'
  | 'hatch'

/** 破甲、法术穿透、重甲、魔甲的展示名和效果句 */
const ARMOR_SKILL_TEXT: Record<ArmorSkillKind, { name: string; effect: (value: number) => string }> = {
  /** 物理攻击无视等量重甲 */
  pierce: { name: '破甲', effect: (value) => `物理攻击无视 ${value} 点重甲` },
  /** 法术攻击无视等量魔甲 */
  spellPierce: { name: '法术穿透', effect: (value) => `法术攻击无视 ${value} 点魔甲` },
  /** 减免等量物理伤害 */
  plate: { name: '重甲', effect: (value) => `减免 ${value} 点物理伤害` },
  /** 减免等量法术伤害 */
  ward: { name: '魔甲', effect: (value) => `减免 ${value} 点法术伤害` },
}

/**
 * 做成一条护甲或穿透技能。卡面显示「破甲 2 ~ 物理攻击无视 2 点重甲」这种一行。
 *
 * @param kind 破甲、法术穿透、重甲或魔甲
 * @param value 点数，同时写进名字和效果
 * @returns 可放进卡牌技能栏的一条技能
 */
export function armorSkill(kind: ArmorSkillKind, value: number): CardSkill {
  const text = ARMOR_SKILL_TEXT[kind]
  return { name: `${text.name} ${value}`, effect: text.effect(value), kind, value }
}

/** 开局就在卡组里的步兵。没有护甲或穿透，用来对照后面的兵种 */
export const INFANTRY_CARD: UnitCardData = {
  id: 'infantry',
  name: '步兵',
  rarity: 'white',
  mark: '步',
  race: 'human',
  profession: '步兵',
  cd: 1,
  atk: 2,
  hp: 4,
  move: 2,
  speed: 3,
  range: 1,
  attackKind: 'physical',
  skills: [],
}

/**
 * 基础兵种。数值和步兵同一量级。
 * 重甲、魔甲是减伤，破甲、法术穿透是打掉对应护甲。
 * 速度：步兵和弓箭手 3，火枪手和法师 2，重甲步兵和魔卫 1。
 */
export const BASIC_UNIT_CARDS: readonly UnitCardData[] = [
  INFANTRY_CARD,
  /** 厚血步兵，用重甲挡物理伤害 */
  {
    id: 'heavy-infantry',
    name: '重甲步兵',
    rarity: 'blue',
    mark: '重',
    race: 'human',
    profession: '步兵',
    cd: 2,
    atk: 2,
    hp: 6,
    move: 1,
    speed: 1,
    range: 1,
    attackKind: 'physical',
    skills: [armorSkill('plate', 2)],
  },
  /** 脆的远程，没有护甲技能 */
  {
    id: 'archer',
    name: '弓箭手',
    rarity: 'green',
    mark: '弓',
    race: 'human',
    profession: '弓手',
    cd: 1,
    atk: 3,
    hp: 3,
    move: 2,
    speed: 3,
    range: 3,
    attackKind: 'physical',
    skills: [],
  },
  /** 慢一拍的远程，破甲用来打重甲 */
  {
    id: 'musketeer',
    name: '火枪手',
    rarity: 'green',
    mark: '枪',
    race: 'human',
    profession: '火枪',
    cd: 2,
    atk: 4,
    hp: 3,
    move: 1,
    speed: 2,
    range: 3,
    attackKind: 'physical',
    skills: [armorSkill('pierce', 2)],
  },
  /** 脆的法术输出，穿透用来打魔甲 */
  {
    id: 'mage',
    name: '法师',
    rarity: 'green',
    mark: '法',
    race: 'human',
    profession: '法师',
    cd: 2,
    atk: 4,
    hp: 2,
    move: 1,
    speed: 2,
    range: 3,
    attackKind: 'spell',
    skills: [armorSkill('spellPierce', 2)],
  },
  /** 偏肉的近战，用魔甲挡法术伤害 */
  {
    id: 'ward-guard',
    name: '魔卫',
    rarity: 'blue',
    mark: '卫',
    race: 'human',
    profession: '卫士',
    cd: 2,
    atk: 1,
    hp: 5,
    move: 1,
    speed: 1,
    range: 1,
    attackKind: 'physical',
    skills: [armorSkill('ward', 2)],
  },
]

/**
 * 紫色近战。攻击 2、血量 7、移动 2、速度 2、范围 1。
 * 冷却没有单独给出，按重装近战记为 2。
 */
export const TEMPLE_KNIGHT_CARD: UnitCardData = {
  id: 'temple-knight',
  name: '圣殿骑士',
  rarity: 'purple',
  mark: '骑',
  race: 'human',
  profession: '骑士',
  cd: 2,
  atk: 2,
  hp: 7,
  move: 2,
  speed: 2,
  range: 1,
  attackKind: 'physical',
  skills: [
    { name: '治疗 1', effect: '行动开始前，为生命值最低的友方回复 1 点生命值', kind: 'heal', value: 1 },
    { name: '警戒', effect: '优先追击后方的敌人单位', kind: 'vigilance' },
  ],
}

/** 初始卡组。基础兵种都先放在这里，卡组编辑以后再拆 */
export const INITIAL_DECK: readonly UnitCardData[] = BASIC_UNIT_CARDS
