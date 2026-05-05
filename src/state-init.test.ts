import { describe, it, expect } from 'vitest'
import { createConfigForPreset, createInitialState } from './state-init'
import { GRID_PRESETS } from './core/constants'

describe('createConfigForPreset', () => {
  it('small preset produces 10x8 grid dimensions', () => {
    const config = createConfigForPreset('small')
    expect(config.grid.defaultWidth).toBe(GRID_PRESETS.small.width)
    expect(config.grid.defaultHeight).toBe(GRID_PRESETS.small.height)
  })

  it('large preset produces 30x40 grid dimensions', () => {
    const config = createConfigForPreset('large')
    expect(config.grid.defaultWidth).toBe(GRID_PRESETS.large.width)
    expect(config.grid.defaultHeight).toBe(GRID_PRESETS.large.height)
  })

  it('preserves non-grid config from defaults', () => {
    const config = createConfigForPreset('small')
    expect(config.monsters.nijirigoke).toBeDefined()
    expect(config.hero.life).toBeGreaterThan(0)
  })
})

describe('createInitialState', () => {
  it('builds GameState matching small preset dimensions', () => {
    const config = createConfigForPreset('small')
    const state = createInitialState(config)
    expect(state.grid.length).toBe(GRID_PRESETS.small.height)
    expect(state.grid[0].length).toBe(GRID_PRESETS.small.width)
  })

  it('seeds high-nutrient soil at (2,6) and (3,4) for small preset', () => {
    const config = createConfigForPreset('small')
    const state = createInitialState(config)
    expect(state.grid[2][6].nutrientAmount).toBeGreaterThanOrEqual(17) // lizardman threshold
    expect(state.grid[3][4].nutrientAmount).toBeGreaterThanOrEqual(10) // gaji threshold
  })

  it('reports totalInitialNutrients = 200', () => {
    const config = createConfigForPreset('small')
    const state = createInitialState(config)
    expect(state.totalInitialNutrients).toBe(200)
  })

  it('builds GameState matching large preset dimensions', () => {
    const config = createConfigForPreset('large')
    const state = createInitialState(config)
    expect(state.grid.length).toBe(GRID_PRESETS.large.height)
    expect(state.grid[0].length).toBe(GRID_PRESETS.large.width)
  })
})
