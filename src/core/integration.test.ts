import { describe, it, expect, beforeEach } from 'vitest'
import {
  GameState,
  Cell,
  Monster,
  tick,
  dig,
  initializeNutrients,
  getTotalNutrients,
  isWorldDying,
  resetMonsterIdCounter,
  resetNutrientIdCounter,
  MONSTER_CONFIGS,
} from './index'

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0 }))
  )
}

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    grid: createGrid(10, 10),
    monsters: [],
    nutrients: [],
    totalInitialNutrients: 100,
    ...overrides,
  }
}

describe('Integration Tests', () => {
  beforeEach(() => {
    resetMonsterIdCounter()
    resetNutrientIdCounter()
  })

  describe('Full game cycle', () => {
    it('should handle dig -> multiple ticks -> predation cycle', () => {
      // Create grid with soil
      const grid = createGrid(10, 10, 'empty')
      // Add soil blocks
      for (let y = 2; y < 8; y++) {
        for (let x = 2; x < 8; x++) {
          grid[y][x] = { type: 'soil', nutrientAmount: 10 }
        }
      }

      // Initialize nutrients
      const { grid: initializedGrid } = initializeNutrients(grid, 360)

      let state = createGameState({
        grid: initializedGrid,
        totalInitialNutrients: 360,
      })

      // Dig to spawn Nijirigoke
      const digResult1 = dig(state, { x: 3, y: 3 })
      expect('error' in digResult1).toBe(false)
      if (!('error' in digResult1)) {
        state = digResult1.state
        expect(state.monsters).toHaveLength(1)
        expect(state.monsters[0].type).toBe('nijirigoke')
      }

      // Dig another to spawn second Nijirigoke
      const digResult2 = dig(state, { x: 5, y: 5 })
      expect('error' in digResult2).toBe(false)
      if (!('error' in digResult2)) {
        state = digResult2.state
        expect(state.monsters).toHaveLength(2)
      }

      // Run several ticks
      for (let i = 0; i < 5; i++) {
        const tickResult = tick(state)
        state = tickResult.state
      }

      // Monsters should have moved and lost life
      for (const monster of state.monsters) {
        expect(monster.life).toBeLessThan(MONSTER_CONFIGS.nijirigoke.life)
      }
    })

    it('should track world entropy through dig actions', () => {
      // Create grid with soil
      const grid = createGrid(10, 10, 'soil')

      // Initialize with lots of nutrients
      const { grid: initializedGrid } = initializeNutrients(grid, 1000)

      let state = createGameState({
        grid: initializedGrid,
        totalInitialNutrients: 1000,
      })

      const initialNutrients = getTotalNutrients(state)
      expect(initialNutrients).toBe(1000)

      // Dig multiple times (each dig loses 30% of cell nutrients)
      for (let i = 0; i < 5; i++) {
        const result = dig(state, { x: 2 + i, y: 2 })
        if (!('error' in result)) {
          state = result.state
        }
      }

      // Total nutrients should have decreased
      const finalNutrients = getTotalNutrients(state)
      expect(finalNutrients).toBeLessThan(initialNutrients)
    })

    it('should detect world dying when nutrients are low', () => {
      const grid = createGrid(5, 5, 'empty')

      const state = createGameState({
        grid,
        nutrients: [{ id: 'n1', position: { x: 2, y: 2 }, amount: 5, carriedBy: null }],
        totalInitialNutrients: 100,
      })

      // 5 < 100 * 0.1 = 10
      expect(isWorldDying(state, 0.1)).toBe(true)
    })

    it('should handle predation food chain', () => {
      const grid = createGrid(10, 10, 'empty')

      // Create food chain: Gajigajimushi -> Nijirigoke
      // Both moving toward each other, meeting at (5,5)
      const nijirigoke: Monster = {
        id: 'n1',
        type: 'nijirigoke',
        position: { x: 6, y: 5 }, // moving left to (5,5)
        direction: 'left',
        pattern: 'straight',
        life: 10,
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: null,
        nestPosition: null,
      }

      const gajigajimushi: Monster = {
        id: 'g1',
        type: 'gajigajimushi',
        position: { x: 4, y: 5 }, // moving right to (5,5)
        direction: 'right',
        pattern: 'straight',
        life: 20,
        maxLife: 30,
        attack: 3,
        predationTargets: ['nijirigoke'],
        carryingNutrient: null,
        nestPosition: null,
      }

      let state = createGameState({
        grid,
        monsters: [nijirigoke, gajigajimushi],
      })

      // First tick: both move to (5,5), predation occurs
      const result = tick(state)
      state = result.state

      // Only gajigajimushi should remain
      expect(state.monsters).toHaveLength(1)
      expect(state.monsters[0].type).toBe('gajigajimushi')

      // Gajigajimushi should have gained life from eating nijirigoke
      // 20 + 10 - 1 (movement cost) = 29
      expect(state.monsters[0].life).toBe(29)

      // Should have PREDATION event
      expect(result.events.some((e) => e.type === 'PREDATION')).toBe(true)
    })

    it('should handle monster starvation', () => {
      const grid = createGrid(10, 10, 'empty')

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
        direction: 'right',
        pattern: 'straight',
        life: 3, // will die after 3 moves
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: null,
        nestPosition: null,
      }

      let state = createGameState({ grid, monsters: [monster] })
      let starvationEvents = 0

      // Run ticks until monster dies
      for (let i = 0; i < 5; i++) {
        const result = tick(state)
        state = result.state

        if (result.events.some((e) => e.type === 'MONSTER_DIED' && e.cause === 'starvation')) {
          starvationEvents++
        }

        if (state.monsters.length === 0) break
      }

      expect(state.monsters).toHaveLength(0)
      expect(starvationEvents).toBe(1)
    })

    it('should handle nutrient carrying and dropping on predation', () => {
      const grid = createGrid(10, 10, 'empty')

      // Both monsters moving to (5,5)
      const nijirigoke: Monster = {
        id: 'n1',
        type: 'nijirigoke',
        position: { x: 6, y: 5 }, // moving left to (5,5)
        direction: 'left',
        pattern: 'straight',
        life: 10,
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 'nutrient-1',
        nestPosition: null,
      }

      const gajigajimushi: Monster = {
        id: 'g1',
        type: 'gajigajimushi',
        position: { x: 4, y: 5 }, // moving right to (5,5)
        direction: 'right',
        pattern: 'straight',
        life: 20,
        maxLife: 30,
        attack: 3,
        predationTargets: ['nijirigoke'],
        carryingNutrient: null,
        nestPosition: null,
      }

      let state = createGameState({
        grid,
        monsters: [nijirigoke, gajigajimushi],
        nutrients: [
          { id: 'nutrient-1', position: { x: 0, y: 0 }, amount: 5, carriedBy: 'n1' },
        ],
      })

      const result = tick(state)
      state = result.state

      // Nutrient should be dropped at predation location (5,5)
      expect(state.nutrients[0].carriedBy).toBeNull()
      // Nutrient position should be where predation happened
      expect(state.nutrients[0].position).toEqual({ x: 5, y: 5 })
    })
  })
})
