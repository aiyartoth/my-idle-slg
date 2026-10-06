import { RACE_LABEL, type UnitCardData } from './cards'

/**
 * 卡面类型行，按「类别-种族/子类」来写。
 * 机械的类别是机械，种族和职责放在连字符右边。元素单独成类。
 * 带「法师」的单位算法术单位，破法者的反馈打他们，牧师和女巫也算。
 */
const TYPE_LINE_BY_ID: Record<string, string> = {
  /** 步兵、黄巾步兵、重甲步兵 */
  infantry: '生物-人类/步兵',
  'yellow-infantry': '生物-人类/步兵',
  'heavy-infantry': '生物-人类/步兵',
  /** 弓箭手、黄巾弓箭手 */
  archer: '生物-人类/弓手',
  'yellow-archer': '生物-人类/弓手',
  /** 火枪手、法师、魔卫 */
  musketeer: '生物-人类/火枪',
  mage: '生物-人类/法师',
  'ward-guard': '生物-人类/卫士',
  /** 骑士、圣殿骑士 */
  knight: '生物-人类/骑士',
  'temple-knight': '生物-人类/骑士',
  /** 牧师也是法师，破法者反馈会打到 */
  priest: '生物-人类/法师/牧师',
  /** 高等精灵女巫，同时是法师。弓手、剑士和温蕾萨不是法师 */
  sorceress: '生物-高等精灵/法师/女巫',
  'high-elf-archer': '生物-高等精灵/弓手',
  'high-elf-swordsman': '生物-高等精灵/剑士',
  vereesa: '传奇生物-高等精灵/猎人',
  /** 破法者 */
  'spell-breaker': '生物-高等精灵/破法者',
  /** 矮人炮组，人还在，不算载具 */
  'mortar-team': '生物-矮人/炮兵',
  /** 矮人蒸汽坦克 */
  'siege-engine': '机械-矮人/攻城/载具',
  /** 侏儒旋翼机、技师、修理兵、格尔宾、米尔豪斯 */
  'flying-machine': '机械-侏儒/飞行器/载具',
  'gnome-tinker': '生物-侏儒/技师',
  'gnome-repair': '生物-侏儒/修理兵',
  mekkatorque: '传奇生物-侏儒/技师',
  millhouse: '传奇生物-侏儒/法师',
  /** 矮人狮鹫骑士、步枪猎手 */
  'gryphon-rider': '生物-矮人/狮鹫',
  'dwarf-hunter': '生物-矮人/猎人',
  /** 英雄：瓦格斯、张角、穆拉丁、加文拉德、德雷克塔尔、纳拉雷克斯、达里安 */
  archmage: '传奇生物-人类/法师',
  'zhang-jiao': '传奇生物-人类/法师',
  'mountain-king': '传奇生物-矮人/战士',
  paladin: '传奇生物-人类/圣骑士',
  shaman: '传奇生物-兽人/萨满',
  druid: '传奇生物-暗夜精灵/德鲁伊',
  'death-knight': '传奇生物-人类/死亡骑士',
  /** 魔兽传奇生物。类型行用传奇生物前缀，祭司和术士带法师子类，反馈会打到 */
  thrall: '传奇生物-兽人/萨满',
  mograine: '传奇生物-人类/圣骑士',
  arthas: '传奇生物-亡灵/死亡骑士',
  illidan: '传奇生物-暗夜精灵/恶魔猎手',
  jaina: '传奇生物-人类/法师',
  sylvanas: '传奇生物-亡灵/游侠',
  tyrande: '传奇生物-暗夜精灵/法师/祭司',
  guldan: '传奇生物-兽人/法师/术士',
  kaelthas: '传奇生物-血精灵/法师',
  /** 龙鹰、血骑士、魔导师、远行者。凤凰仍是元素 */
  dragonhawk: '生物-血精灵/龙鹰',
  'blood-knight': '生物-血精灵/圣骑士',
  magister: '生物-血精灵/法师',
  farstrider: '生物-血精灵/弓手',
  rexxar: '传奇生物-兽人/猎人',
  /** 召唤物。凤凰单独成元素，和卡面种族分开 */
  'ghost-wolf': '生物-野兽',
  ghoul: '生物-亡灵/食尸鬼',
  banshee: '生物-亡灵/女妖',
  infernal: '生物-恶魔',
  /** 地狱犬、末日守卫、恶魔卫士、魅魔 */
  felhound: '生物-恶魔/地狱犬',
  'doom-guard': '生物-恶魔/末日守卫',
  'fel-guard': '生物-恶魔/卫士',
  succubus: '生物-恶魔/魅魔',
  phoenix: '元素',
  'phoenix-egg': '元素',
  misha: '生物-野兽',
  /** 奇美拉、角鹰兽按野兽归类，不进暗夜精灵 */
  chimaera: '生物-野兽/奇美拉',
  hippogryph: '生物-野兽/角鹰兽',
  /** 战士、猎人、潜行者。暗影牧师、冰霜法师、术士带法师子类，反馈会打到 */
  warrior: '生物-人类/战士',
  hunter: '生物-人类/猎人',
  rogue: '生物-人类/潜行者',
  'shadow-priest': '生物-人类/法师/牧师',
  'frost-mage': '生物-人类/法师',
  warlock: '生物-人类/法师/术士',
  /** 水元素、火元素单独成类 */
  'water-elemental': '元素',
  'fire-elemental': '元素',
  /** 变形术变出来的绵羊 */
  sheep: '生物-野兽',
  /** 魔兽争霸 3 战役兵。巫医和亡灵巫师不带法师子类，反馈打不到 */
  grunt: '生物-兽人/步兵',
  raider: '生物-兽人/掠夺者',
  'witch-doctor': '生物-兽人/巫医',
  huntress: '生物-暗夜精灵/女猎手',
  dryad: '生物-暗夜精灵/树妖',
  tauren: '生物-兽人/战士',
  kodo: '生物-兽人/科多兽',
  abomination: '生物-亡灵/憎恶',
  necromancer: '生物-亡灵/巫师',
  'frost-wyrm': '生物-亡灵/冰霜巨龙',
  'mountain-giant': '生物-暗夜精灵/巨人',
  skeleton: '生物-亡灵/骷髅',
}

/**
 * 取出这张卡在列表上的类型行。
 * 没单独配过的牌，用「生物-种族/职业」兜底。
 *
 * @param card 单位卡
 * @returns 如「生物-人类/步兵」「机械-矮人/攻城/载具」「元素」
 */
export function cardTypeLine(card: UnitCardData): string {
  return TYPE_LINE_BY_ID[card.id] ?? `生物-${RACE_LABEL[card.race]}/${card.profession}`
}

/**
 * 这张卡是不是法师。牧师、女巫也算。
 * 破法者的反馈只加在这种单位上。
 *
 * @param card 单位卡
 * @returns 类型行的子类里有「法师」时为 true
 */
export function isMageType(card: UnitCardData): boolean {
  const subtypes = cardTypeLine(card).split('-')[1] ?? ''
  return subtypes.split('/').includes('法师')
}

/**
 * 这张卡是不是传奇生物。卡组里同名传奇只能留一张。
 *
 * @param card 单位卡
 * @returns 类型行以「传奇生物」开头时为 true
 */
export function isLegendCard(card: UnitCardData): boolean {
  return cardTypeLine(card).startsWith('传奇生物')
}
