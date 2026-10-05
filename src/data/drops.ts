import type { UnitCardData } from './cards'
import { YELLOW_TURBAN_ENEMY_DECK, YELLOW_TURBAN_LOOT_EXP, YELLOW_TURBAN_LOOT_GOLD } from '../realm/yellowTurban'

/** 每只实际上场的敌方单位，掉一张同名卡的概率 */
const UNIT_DROP_CHANCE = 0.5

/** 天公将军张角的掉卡概率。橙色，比普通单位的五成更低 */
const ZHANG_JIAO_DROP_CHANCE = 0.1

/** 一种合成材料。合成还没做，先按概率掉进背包 */
export interface MaterialDrop {
  id: string
  name: string
  /** 每次通关判定一次，0 到 1 */
  chance: number
  /** 判定成功时掉几个 */
  count: number
}

/** 一个秘境的掉落表。金币和经验仍是固定的，卡牌和材料看概率 */
export interface RealmDropTable {
  gold: number
  exp: number
  /** 每只上场的敌方单位独立掷一次 */
  unitChance: number
  /** 个别单位单独的掉率。没写的用 unitChance */
  unitChances?: Readonly<Record<string, number>>
  materials: readonly MaterialDrop[]
}

/** 黄巾之乱。材料给以后的合成用，铁矿比木头少见 */
export const YELLOW_TURBAN_DROPS: RealmDropTable = {
  gold: YELLOW_TURBAN_LOOT_GOLD,
  exp: YELLOW_TURBAN_LOOT_EXP,
  unitChance: UNIT_DROP_CHANCE,
  unitChances: { 'zhang-jiao': ZHANG_JIAO_DROP_CHANCE },
  materials: [
    { id: 'wood', name: '木材', chance: 0.7, count: 1 },
    { id: 'stone', name: '石头', chance: 0.5, count: 1 },
    { id: 'iron-ore', name: '铁矿石', chance: 0.3, count: 1 },
  ],
}

const DROP_TABLES: Record<string, RealmDropTable> = {
  'yellow-turban': YELLOW_TURBAN_DROPS,
}

/** 一次通关掷出来的卡牌 */
export interface LootCard {
  name: string
  card: UnitCardData
  count: number
}

/** 一次通关掷出来的材料 */
export interface LootMaterial {
  id: string
  name: string
  count: number
}

/** 一次或多次通关叠在一起的战利品 */
export interface RealmLoot {
  gold: number
  exp: number
  cards: LootCard[]
  materials: LootMaterial[]
}

/**
 * 按上场过的敌方单位和材料表掷一次战利品。
 *
 * @param realmId 秘境 id
 * @param appearedEnemies 这场战斗里实际召唤出来的敌方单位，一只算一次
 * @param random 返回 0 到 1。测试可以传入固定值
 * @returns 金币、经验，以及掷中的卡牌和材料。没有这个秘境时是空的
 */
export function rollClearLoot(realmId: string, appearedEnemies: readonly UnitCardData[], random: () => number = Math.random): RealmLoot {
  const table = DROP_TABLES[realmId]
  if (!table) return { gold: 0, exp: 0, cards: [], materials: [] }
  const cards: LootCard[] = []
  appearedEnemies.forEach((card) => {
    if (random() >= (table.unitChances?.[card.id] ?? table.unitChance)) return
    const found = cards.find((drop) => drop.card.id === card.id)
    if (found) found.count += 1
    else cards.push({ name: card.name, card, count: 1 })
  })
  const materials: LootMaterial[] = []
  table.materials.forEach((material) => {
    if (random() >= material.chance) return
    materials.push({ id: material.id, name: material.name, count: material.count })
  })
  return { gold: table.gold, exp: table.exp, cards, materials }
}

/**
 * 挂机按通关次数重复掷。每次都用这个秘境会出场的敌方单位，不回放某一场的过程。
 *
 * @param realmId 秘境 id
 * @param clears 通关次数
 * @param random 返回 0 到 1
 * @returns 叠好的战利品
 */
export function lootForClears(realmId: string, clears: number, random: () => number = Math.random): RealmLoot {
  const enemies = realmId === 'yellow-turban' ? YELLOW_TURBAN_ENEMY_DECK : []
  const total: RealmLoot = { gold: 0, exp: 0, cards: [], materials: [] }
  for (let index = 0; index < clears; index += 1) {
    const once = rollClearLoot(realmId, enemies, random)
    total.gold += once.gold
    total.exp += once.exp
    once.cards.forEach((drop) => addCard(total.cards, drop))
    once.materials.forEach((drop) => addMaterial(total.materials, drop))
  }
  return total
}

/**
 * 战斗底部和结算浮层用的一行战利品。
 *
 * @param loot 已经掷好的奖励
 * @returns 经验、金币、卡牌和材料
 */
export function formatLoot(loot: RealmLoot): string {
  const parts = [`经验 ${loot.exp}`, `金币 ${loot.gold}`]
  loot.cards.forEach((drop) => parts.push(drop.count > 1 ? `卡牌: ${drop.name} ×${drop.count}` : `卡牌: ${drop.name}`))
  loot.materials.forEach((drop) => parts.push(drop.count > 1 ? `材料: ${drop.name} ×${drop.count}` : `材料: ${drop.name}`))
  return parts.join(' · ')
}

/**
 * 把同名卡的数量叠进列表。
 *
 * @param cards 已经掷中的卡
 * @param drop 新的一张或一叠
 */
function addCard(cards: LootCard[], drop: LootCard): void {
  const found = cards.find((item) => item.card.id === drop.card.id)
  if (found) found.count += drop.count
  else cards.push({ ...drop })
}

/**
 * 把同一种材料的数量叠进列表。
 *
 * @param materials 已经掷中的材料
 * @param drop 新的一份
 */
function addMaterial(materials: LootMaterial[], drop: LootMaterial): void {
  const found = materials.find((item) => item.id === drop.id)
  if (found) found.count += drop.count
  else materials.push({ ...drop })
}
