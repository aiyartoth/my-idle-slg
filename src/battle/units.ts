/** 预览兵种。顺序也是下拉框的展示顺序：近战、冲锋、远程 */
export const UNIT_IDS = ['shield', 'blade', 'spear', 'halberd', 'cavalry', 'heavy', 'archer', 'crossbow'] as const

export type UnitId = (typeof UNIT_IDS)[number]

/** 前排打满；冲锋兵只有站前排才切后排；远程在后排不减出力 */
export type Slot = 'front' | 'back'

/** 近战后排减半，冲锋切后排，远程后排全额且前排更容易挨打 */
export type UnitRole = 'melee' | 'charger' | 'ranged'

/** 一格编制。预览人数固定，兵种决定攻击、生命和防御 */
export interface Formation {
  front: UnitId
  back: UnitId
}

/** 每名士兵的基础值。攻击和生命再乘人数，防御不乘 */
export const UNIT_STATS: Record<UnitId, { atk: number; hp: number; def: number; role: UnitRole }> = {
  shield: { atk: 8, hp: 50, def: 40, role: 'melee' },
  blade: { atk: 11, hp: 42, def: 26, role: 'melee' },
  spear: { atk: 12, hp: 36, def: 20, role: 'melee' },
  halberd: { atk: 13, hp: 32, def: 16, role: 'melee' },
  cavalry: { atk: 15, hp: 32, def: 14, role: 'charger' },
  heavy: { atk: 16, hp: 38, def: 24, role: 'charger' },
  archer: { atk: 14, hp: 22, def: 8, role: 'ranged' },
  crossbow: { atk: 16, hp: 20, def: 10, role: 'ranged' },
}

/** 兵种在战报和下拉框里的名字 */
export const UNIT_LABEL: Record<UnitId, string> = {
  shield: '盾兵',
  blade: '刀兵',
  spear: '枪兵',
  halberd: '戟兵',
  cavalry: '骑兵',
  heavy: '重骑',
  archer: '弓兵',
  crossbow: '弩兵',
}

/** 下拉项上的短说明，方便在手机滚轮里分辨职责 */
export const UNIT_HINT: Record<UnitId, string> = {
  shield: '前排承伤',
  blade: '近战克弓弩',
  spear: '克骑兵',
  halberd: '更克骑兵',
  cavalry: '前排切后排',
  heavy: '厚甲冲锋',
  archer: '后排克枪戟',
  crossbow: '后排破盾',
}

/** 站位在界面上的名字 */
export const SLOT_LABEL: Record<Slot, string> = {
  front: '前排',
  back: '后排',
}

/**
 * 克制百分数。100 为持平，135 左右是打得出来的克制。
 * 行是攻击方，列是防守方。原有盾、枪、骑、弓的交叉格保持不变。
 */
export const COUNTER: Record<UnitId, Record<UnitId, number>> = {
  shield: { shield: 100, blade: 95, spear: 90, halberd: 90, cavalry: 115, heavy: 110, archer: 85, crossbow: 80 },
  blade: { shield: 115, blade: 100, spear: 85, halberd: 90, cavalry: 100, heavy: 95, archer: 130, crossbow: 125 },
  spear: { shield: 95, blade: 110, spear: 100, halberd: 100, cavalry: 135, heavy: 140, archer: 80, crossbow: 85 },
  halberd: { shield: 100, blade: 105, spear: 95, halberd: 100, cavalry: 140, heavy: 145, archer: 75, crossbow: 80 },
  cavalry: { shield: 90, blade: 105, spear: 75, halberd: 70, cavalry: 100, heavy: 95, archer: 135, crossbow: 140 },
  heavy: { shield: 100, blade: 110, spear: 70, halberd: 65, cavalry: 105, heavy: 100, archer: 140, crossbow: 145 },
  archer: { shield: 120, blade: 80, spear: 135, halberd: 130, cavalry: 80, heavy: 75, archer: 100, crossbow: 100 },
  crossbow: { shield: 140, blade: 90, spear: 110, halberd: 115, cavalry: 75, heavy: 125, archer: 105, crossbow: 100 },
}

/** 每格人数。预览不开放统率，攻击和生命按这个数线性放大 */
export const SQUAD_SIZE = 100

/** 打满仍未溃败则判平局 */
export const MAX_ROUNDS = 6

/** 总生命低于开战值的这个百分比即溃败 */
export const ROUT_PERCENT = 20

/** 己方前排还活着时，后排近战和冲锋兵的出力 */
export const BACK_MELEE_OUTPUT = 50

/** 弓兵、弩兵顶在前排时的承伤 */
export const RANGED_FRONT_TAKEN = 125

/** 打开页面时的默认局：枪兵藏在后排，用来先看到一场败仗 */
export const PRESET_SPEAR_BACK: { player: Formation; enemy: Formation } = {
  player: { front: 'shield', back: 'spear' },
  enemy: { front: 'cavalry', back: 'archer' },
}

/** 同一对兵种对调前后排，用来对照胜负翻转 */
export const PRESET_SPEAR_FRONT: { player: Formation; enemy: Formation } = {
  player: { front: 'spear', back: 'shield' },
  enemy: { front: 'cavalry', back: 'archer' },
}

/**
 * 判断下拉框的值是不是已知兵种。
 *
 * @param value 原生 select 交上来的字符串
 * @returns 能对应到 UNIT_STATS 时为 true
 */
export function isUnitId(value: string): value is UnitId {
  return (UNIT_IDS as readonly string[]).includes(value)
}
