import { UNIT_HINT, UNIT_LABEL, UNIT_STATS } from './units'
import type { UnitId } from './units'

/** 界面上可点选的关键模块。id 用来定位区块，也用来取说明 */
export const MODULE_IDS = ['formation', 'player', 'enemy', 'front', 'back', 'battle', 'round', 'damage', 'rout'] as const

export type ModuleId = (typeof MODULE_IDS)[number]

/** 点选某个 id 后展示的标题和说明 */
export interface ModuleNote {
  id: string
  title: string
  summary: string
}

/** 关键模块的说明。选择模块时按 id 取这里的文字 */
export const MODULE_NOTES: Record<ModuleId, ModuleNote> = {
  formation: {
    id: 'formation',
    title: '编制',
    summary: '开战前才能改前后排。每格 100 人，点「开战」后编制锁定。',
  },
  player: {
    id: 'player',
    title: '我方',
    summary: '我方的前排和后排。战斗过程中不能换兵，要等打完再调整。',
  },
  enemy: {
    id: 'enemy',
    title: '敌方',
    summary: '敌方使用同一套兵种和克制。开战前可以改，开战中锁定。',
  },
  front: {
    id: 'front',
    title: '前排',
    summary: '前排打满伤害，并先承受攻击。骑兵和重骑只有站在这里才会切后排。',
  },
  back: {
    id: 'back',
    title: '后排',
    summary: '近战和冲锋在后排只打一半，直到前排被清空。弓兵和弩兵在后排打满。',
  },
  battle: {
    id: 'battle',
    title: '战斗',
    summary: '双方同时出招。一方总兵力跌破开战时的 20% 就停，最多 6 回合。',
  },
  round: {
    id: 'round',
    title: '回合',
    summary: '这一回合每个兵种打到了谁、造成了多少伤害。',
  },
  damage: {
    id: 'damage',
    title: '伤害',
    summary: '整场把同一兵种对同一个目标的伤害加在一起。',
  },
  rout: {
    id: 'rout',
    title: '击溃',
    summary: '按剩余生命折算被打掉的人数。生命归零才算这一格全部击溃。',
  },
}

/**
 * 判断一个 id 是不是关键模块，而不是兵种。
 *
 * @param id 点选得到的 id
 * @returns 能在 MODULE_NOTES 里找到时为 true
 */
export function isModuleId(id: string): id is ModuleId {
  return (MODULE_IDS as readonly string[]).includes(id)
}

/**
 * 用 id 取出选择说明。
 * 兵种 id 走兵种说明，模块 id 走模块说明。
 *
 * @param id 模块 id 或兵种 id
 * @returns 标题和一句说明
 */
export function describeModule(id: string): ModuleNote {
  if (isModuleId(id)) return MODULE_NOTES[id]
  if (id in UNIT_STATS) {
    const unitId = id as UnitId
    const stats = UNIT_STATS[unitId]
    return {
      id: unitId,
      title: UNIT_LABEL[unitId],
      summary: `${UNIT_HINT[unitId]}。攻击 ${stats.atk}，生命 ${stats.hp}，防御 ${stats.def}。`,
    }
  }
  return { id, title: '未登记', summary: '这个 id 没有对应说明。' }
}
