/**
 * 这一页侧滑要回到哪里。首页没有上一级，战斗回秘境列表，其余逐级回首页。
 *
 * @param pathname 当前路径，不含查询串
 * @returns 上一级路径；已经在首页时为 null
 */
export function parentPath(pathname: string): string | null {
  const path = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  if (path === '/' || path === '') return null
  if (path.startsWith('/card/deck/')) return '/deck'
  if (path.startsWith('/card/bag/') || path.startsWith('/card/')) return '/bag'
  if (path.startsWith('/realm/')) return '/realm'
  return '/'
}
