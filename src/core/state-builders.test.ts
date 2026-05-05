import { describe, it, expect } from 'vitest'
import { makeEmptyArena, makeScenarioState } from './state-builders'
import { createDefaultConfig } from './config'

describe('makeEmptyArena', () => {
  it('produces walls on all four borders', () => {
    const grid = makeEmptyArena(5, 4)
    expect(grid.length).toBe(4)
    expect(grid[0].length).toBe(5)
    // top/bottom rows are all walls
    grid[0].forEach((c) => expect(c.type).toBe('wall'))
    grid[3].forEach((c) => expect(c.type).toBe('wall'))
    // first/last column are walls
    grid.forEach((row) => {
      expect(row[0].type).toBe('wall')
      expect(row[4].type).toBe('wall')
    })
  })

  it('interior cells are empty (not soil)', () => {
    const grid = makeEmptyArena(6, 5)
    for (let y = 1; y < 4; y++) {
      for (let x = 1; x < 5; x++) {
        expect(grid[y][x].type).toBe('empty')
      }
    }
  })

  it('all cells start with zero nutrients and zero magic', () => {
    const grid = makeEmptyArena(4, 4)
    for (const row of grid) {
      for (const c of row) {
        expect(c.nutrientAmount).toBe(0)
        expect(c.magicAmount).toBe(0)
      }
    }
  })
})

describe('makeScenarioState', () => {
  const config = createDefaultConfig()

  it('returns empty monsters list when no setups given', () => {
    const grid = makeEmptyArena(5, 5)
    const state = makeScenarioState(grid, [], config)
    expect(state.monsters).toEqual([])
    expect(state.gameTime).toBe(0)
    expect(state.isGameOver).toBe(false)
  })

  it('places monsters from setup with config-derived stats', () => {
    const grid = makeEmptyArena(5, 5)
    const state = makeScenarioState(
      grid,
      [
        { type: 'nijirigoke', position: { x: 2, y: 2 }, life: 24, carryingNutrient: 3, phase: 'mobile' },
      ],
      config,
    )
    expect(state.monsters).toHaveLength(1)
    const m = state.monsters[0]
    expect(m.type).toBe('nijirigoke')
    expect(m.position).toEqual({ x: 2, y: 2 })
    expect(m.life).toBe(24)
    expect(m.carryingNutrient).toBe(3)
    expect(m.phase).toBe('mobile')
    expect(m.maxLife).toBe(config.monsters.nijirigoke.life)
    expect(m.attack).toBe(config.monsters.nijirigoke.attack)
    expect(m.pattern).toBe(config.monsters.nijirigoke.pattern)
  })

  it('assigns sequential ids monster-1, monster-2, ...', () => {
    const grid = makeEmptyArena(5, 5)
    const state = makeScenarioState(
      grid,
      [
        { type: 'nijirigoke', position: { x: 1, y: 1 }, life: 10, carryingNutrient: 0, phase: 'mobile' },
        { type: 'gajigajimushi', position: { x: 2, y: 2 }, life: 20, carryingNutrient: 0, phase: 'larva' },
      ],
      config,
    )
    expect(state.monsters[0].id).toBe('monster-1')
    expect(state.monsters[1].id).toBe('monster-2')
    expect(state.nextMonsterId).toBe(2)
  })

  it('places entrance at top-center based on grid width', () => {
    const grid = makeEmptyArena(10, 6)
    const state = makeScenarioState(grid, [], config)
    expect(state.entrancePosition).toEqual({ x: 5, y: 0 })
  })

  it('honors nestPosition and nestOrientation when given', () => {
    const grid = makeEmptyArena(7, 7)
    const state = makeScenarioState(
      grid,
      [
        {
          type: 'lizardman',
          position: { x: 3, y: 3 },
          nestPosition: { x: 3, y: 3 },
          nestOrientation: 'horizontal',
          life: 60,
          carryingNutrient: 5,
          phase: 'normal',
        },
      ],
      config,
    )
    expect(state.monsters[0].nestPosition).toEqual({ x: 3, y: 3 })
    expect(state.monsters[0].nestOrientation).toBe('horizontal')
  })
})
