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
  /** 高等精灵女巫，同时是法师 */
  sorceress: '生物-高等精灵/法师/女巫',
  /** 破法者 */
  'spell-breaker': '生物-高等精灵/破法者',
  /** 矮人炮组，人还在，不算载具 */
  'mortar-team': '生物-矮人/炮兵',
  /** 矮人蒸汽坦克 */
  'siege-engine': '机械-矮人/攻城/载具',
  /** 侏儒旋翼机 */
  'flying-machine': '机械-侏儒/飞行器/载具',
  /** 矮人狮鹫骑士 */
  'gryphon-rider': '生物-矮人/狮鹫',
  /** 英雄：大法师、张角、山丘之王 */
  archmage: '传奇生物-人类/法师',
  'zhang-jiao': '传奇生物-人类/法师',
  'mountain-king': '传奇生物-矮人/战士',
  /** 水元素单独成类 */
  'water-elemental': '元素',
  /** 变形术变出来的绵羊 */
  sheep: '生物-野兽',
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
