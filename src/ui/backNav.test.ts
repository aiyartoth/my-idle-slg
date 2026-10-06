import { describe, expect, it } from 'vitest'
import { parentPath } from './backNav'

describe('侧滑回上一级', () => {
  it('战斗回秘境列表，秘境列表和其余页面回首页', () => {
    expect(parentPath('/')).toBeNull()
    expect(parentPath('/realm/yellow-turban')).toBe('/realm')
    expect(parentPath('/realm')).toBe('/')
    expect(parentPath('/deck')).toBe('/')
    expect(parentPath('/bag')).toBe('/')
    expect(parentPath('/gm')).toBe('/')
    expect(parentPath('/codex')).toBe('/')
    expect(parentPath('/card/bag/b1')).toBe('/bag')
    expect(parentPath('/card/deck/d1')).toBe('/deck')
  })
})
