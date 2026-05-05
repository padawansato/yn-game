import { describe, it, expect } from 'vitest'
import { SCENARIOS } from './index'
import { createDefaultConfig } from '../core/config'

describe('SCENARIOS catalog', () => {
  const config = createDefaultConfig()

  it('contains 4 scenarios with distinct names', () => {
    expect(SCENARIOS).toHaveLength(4)
    const names = SCENARIOS.map((s) => s.name)
    expect(new Set(names).size).toBe(4)
  })

  it.each(SCENARIOS)('scenario "$name" builds a valid 12x10 GameState', (scenario) => {
    const state = scenario.build(config)
    expect(state.grid.length).toBe(10)
    expect(state.grid[0].length).toBe(12)
    expect(state.gameTime).toBe(0)
    expect(state.isGameOver).toBe(false)
    expect(state.monsters.length).toBeGreaterThan(0)
  })

  it('リザードマン産卵: lizardman has nest and high life/nutrient', () => {
    const s = SCENARIOS.find((x) => x.name === 'リザードマン産卵')!
    const state = s.build(config)
    const liz = state.monsters.find((m) => m.type === 'lizardman')!
    expect(liz.nestPosition).not.toBeNull()
    expect(liz.nestOrientation).toBe('horizontal')
    expect(liz.life).toBeGreaterThan(config.monsters.lizardman.layingLifeThreshold!)
  })

  it('ニジリゴケ変態: places 4 nutrient-bearing soil cells around the nijirigoke', () => {
    const s = SCENARIOS.find((x) => x.name === 'ニジリゴケ変態')!
    const state = s.build(config)
    const nutrientCells = state.grid.flat().filter((c) => c.type === 'soil' && c.nutrientAmount > 0)
    expect(nutrientCells).toHaveLength(4)
  })

  it('捕食チェーン: spawns 4 monsters across all three types', () => {
    const s = SCENARIOS.find((x) => x.name === '捕食チェーン')!
    const state = s.build(config)
    expect(state.monsters).toHaveLength(4)
    const types = new Set(state.monsters.map((m) => m.type))
    expect(types.has('lizardman')).toBe(true)
    expect(types.has('gajigajimushi')).toBe(true)
    expect(types.has('nijirigoke')).toBe(true)
  })
})
