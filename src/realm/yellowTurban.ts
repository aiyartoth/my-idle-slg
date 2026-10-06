import { BASIC_UNIT_CARDS, INFANTRY_CARD, type UnitCardData } from '../data/cards'
import { parseMap } from './board'
import { createBattle, type BattleState } from './battle'

/** 没传入大本营生命时的默认值。玩家正式开战改用等级计算的生命 */
export const PLAYER_BASE_HP = 40

/** 黄巾之乱敌方大本营生命 */
export const YELLOW_TURBAN_BASE_HP = 10

/** 黄巾之乱胜利后的金币。战斗动画全部播完才发放 */
export const YELLOW_TURBAN_LOOT_GOLD = 30

/** 黄巾之乱胜利后的经验。升级规则以后再单独算 */
export const YELLOW_TURBAN_LOOT_EXP = 10

/**
 * 黄巾之乱的棋盘。右上角 EE 是敌方 2x2 大本营，左下角 PP 是我方。
 * 中间有森林、河流和石头，中间四列留出通路。
 */
const YELLOW_TURBAN_MAP = [
  '........EE',
  '........EE',
  '..........',
  '.FF....S..',
  'RRR....RRR',
  '..SF..FS..',
  '.F......S.',
  '..........',
  'PP........',
  'PP........',
]

/** 秘境列表上的一条。没开放的不能点进去 */
export interface RealmInfo {
  id: string
  name: string
  /** 是否已经开放 */
  open: boolean
  /** 列表上的一行说明 */
  detail: string
}

/**
 * 秘境在首页日志里用的名字。还没登记的 id 就原样显示。
 *
 * @param realmId 秘境 id
 * @returns 列表上的名字
 */
export function realmName(realmId: string): string {
  return REALMS.find((realm) => realm.id === realmId)?.name ?? realmId
}

/** 目前只开放黄巾之乱 */
export const REALMS: readonly RealmInfo[] = [
  {
    id: 'yellow-turban',
    name: '黄巾之乱',
    open: true,
    detail: '敌方大本营 10 · 黄巾步兵、黄巾弓箭手、天公将军张角',
  },
]

/** 黄巾步兵。攻击、血量、冷却、移动、速度和范围与步兵相同 */
export const YELLOW_INFANTRY_CARD: UnitCardData = {
  ...INFANTRY_CARD,
  id: 'yellow-infantry',
  name: '黄巾步兵',
  mark: '巾',
}

/** 黄巾弓箭手。属性和弓箭手相同 */
export const YELLOW_ARCHER_CARD: UnitCardData = {
  ...archerCard(),
  id: 'yellow-archer',
  name: '黄巾弓箭手',
  mark: '射',
}

/**
 * 黄巾之乱的开局。开战前双方洗牌，再各摸 3 张。
 *
 * @param playerBaseHp 我方大本营生命。不传时用默认值，正式开战传入等级算出的生命
 * @param playerDeck 我方卡组。不传时用基础兵种
 * @param random 洗牌用的随机数，返回 0 到 1
 * @returns 可以一步步推进的战斗
 */
export function createYellowTurbanBattle(
  playerBaseHp: number = PLAYER_BASE_HP,
  playerDeck: readonly UnitCardData[] = BASIC_UNIT_CARDS,
  random: () => number = Math.random,
): BattleState {
  return createBattle(
    {
      playerBaseHp,
      enemyBaseHp: YELLOW_TURBAN_BASE_HP,
      tiles: parseMap(YELLOW_TURBAN_MAP),
      playerDeck,
      enemyDeck: YELLOW_TURBAN_ENEMY_DECK,
    },
    random,
  )
}

/**
 * 橙色法师。攻击 2、血量 7、移动 2、速度 2、范围 3，攻击按法术结算。
 * 技能里的黄巾弓兵用现有的黄巾弓箭手。
 */
export const ZHANG_JIAO_CARD: UnitCardData = {
  id: 'zhang-jiao',
  name: '天公将军张角',
  rarity: 'orange',
  mark: '角',
  race: 'human',
  profession: '法师',
  cd: 5,
  atk: 2,
  hp: 7,
  move: 2,
  speed: 2,
  range: 3,
  attackKind: 'spell',
  skills: [
    {
      name: '撒豆成兵',
      effect: '每回合开始在周围召唤一张黄巾步兵或者黄巾弓兵',
      kind: 'bean',
      summons: [YELLOW_INFANTRY_CARD, YELLOW_ARCHER_CARD],
    },
    { name: '雷电招来 3', effect: '对随机一个敌方造成3点雷电法术伤害', kind: 'lightning', value: 3 },
  ],
}

/** 黄巾之乱会出场的敌方单位。挂机按这几只来掷卡牌掉落，张角另用更低的掉率 */
export const YELLOW_TURBAN_ENEMY_DECK: readonly UnitCardData[] = [YELLOW_INFANTRY_CARD, YELLOW_INFANTRY_CARD, YELLOW_ARCHER_CARD, ZHANG_JIAO_CARD]

/**
 * 从基础兵里找出弓箭手，给黄巾弓箭手抄属性。
 *
 * @returns 弓箭手卡
 */
function archerCard(): UnitCardData {
  const card = BASIC_UNIT_CARDS.find((item) => item.id === 'archer')
  if (!card) throw new Error('缺少弓箭手')
  return card
}
