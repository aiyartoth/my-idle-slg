import { describe, expect, it } from 'vitest'
import { describeModule } from './modules'

describe('describeModule', () => {
  it('用模块 id 取出编制说明', () => {
    expect(describeModule('formation')).toMatchObject({
      id: 'formation',
      title: '编制',
    })
  })

  it('用兵种 id 取出该兵的说明', () => {
    expect(describeModule('crossbow')).toMatchObject({
      id: 'crossbow',
      title: '弩兵',
    })
    expect(describeModule('spear').summary).toContain('克骑兵')
  })
})
