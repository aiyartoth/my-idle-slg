/** 详略按页面分开记，卡组和图鉴互不影响 */
const MEMORY: Record<CardListPage, boolean> = {
  /** 卡组管理 */
  deck: false,
  /** 图鉴 */
  codex: false,
}

/** sessionStorage 键前缀。同一次打开里刷新或返回详情页时还能读回来 */
const STORAGE_PREFIX = 'card-list-brief:'

/** 会离开再回来、需要记住详略的页面 */
export type CardListPage = 'deck' | 'codex'

/**
 * 读出这个页面上次的详略。从卡牌详情返回时用，避免变回详细列表。
 *
 * @param page 卡组或图鉴
 * @returns 简略为 true，详细为 false
 */
export function readCardListBrief(page: CardListPage): boolean {
  const stored = readStored(page)
  if (stored !== null) {
    MEMORY[page] = stored
    return stored
  }
  return MEMORY[page]
}

/**
 * 记下详略。同一次打开里换页再回来仍然有效。
 *
 * @param page 卡组或图鉴
 * @param brief 简略为 true
 */
export function writeCardListBrief(page: CardListPage, brief: boolean): void {
  MEMORY[page] = brief
  try {
    sessionStorage.setItem(STORAGE_PREFIX + page, brief ? 'brief' : 'detail')
  } catch {
    // 写不进存储时，内存里的值仍然能撑住这次停留
  }
}

/**
 * 从 sessionStorage 读详略。没有记录或存储不可用时返回 null。
 *
 * @param page 卡组或图鉴
 * @returns 已保存的详略；没有记录时为 null
 */
function readStored(page: CardListPage): boolean | null {
  try {
    const value = sessionStorage.getItem(STORAGE_PREFIX + page)
    if (value === 'brief') return true
    if (value === 'detail') return false
    return null
  } catch {
    return null
  }
}
