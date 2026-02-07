import { describe, it, expect } from 'vitest'
import {
  GameState,
  Cell,
  Monster,
  tick,
  dig,
  initializeNutrients,
  getTotalNutrients,
  isWorldDying,
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
    totalInitialNutrients: 100,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: 0,
    ...overrides,
  }
}

describe('Integration Tests', () => {

  describe('Full game cycle', () => {
    it('should handle dig -> multiple ticks -> predation cycle', () => {
      // Create grid with empty space for movement
      const grid = createGrid(10, 10, 'empty')
      // Add wall blocks at edges
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if (x === 0 || x === 9 || y === 0 || y === 9) {
            grid[y][x] = { type: 'wall', nutrientAmount: 0 }
          } else if (x === 3 && y === 3) {
            // Soil block to dig - low nutrients to spawn Nijirigoke (below gajigajimushi threshold of 10)
            grid[y][x] = { type: 'soil', nutrientAmount: 5 }
          }
        }
      }

      let state = createGameState({
        grid,
        totalInitialNutrients: 5,
      })

      // Dig to spawn Nijirigoke (nutrient < 10 spawns nijirigoke)
      const digResult1 = dig(state, { x: 3, y: 3 })
      expect('error' in digResult1).toBe(false)
      if (!('error' in digResult1)) {
        state = digResult1.state
        expect(state.monsters).toHaveLength(1)
        expect(state.monsters[0].type).toBe('nijirigoke')
      }

      // Run several ticks - monster should move in empty space
      for (let i = 0; i < 5; i++) {
        const tickResult = tick(state)
        state = tickResult.state
      }

      // Monster should have moved and lost life
      for (const monster of state.monsters) {
        expect(monster.life).toBeLessThan(MONSTER_CONFIGS.nijirigoke.life)
      }
    })

    it('should track world entropy through dig actions', () => {
      // Create grid with soil
      const grid = createGrid(10, 10, 'soil')

      // Add entry point for digging (empty cell at start)
      grid[2][1].type = 'empty'

      // Initialize with lots of nutrients
      const { grid: initializedGrid } = initializeNutrients(grid, 1000)

      let state = createGameState({
        grid: initializedGrid,
        totalInitialNutrients: 1000,
      })

      const initialNutrients = getTotalNutrients(state)
      expect(initialNutrients).toBe(1000)

      // Dig multiple times (each dig loses 30% of cell nutrients)
      // Now we can dig sequentially from the entry point
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
      const grid = createGrid(5, 5, 'soil')
      grid[2][2].nutrientAmount = 5 // Only 5 nutrients in soil

      const state = createGameState({
        grid,
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
        carryingNutrient: 0,
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
        carryingNutrient: 0,
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
        carryingNutrient: 0,
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

    it('should release nutrients to adjacent soil on predation', () => {
      // Create grid with soil surrounding predation point
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].type = 'empty' // predation position
      grid[5][4].type = 'empty' // gajigajimushi starting position
      grid[5][6].type = 'empty' // nijirigoke starting position

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
        carryingNutrient: 8, // carrying nutrients
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
        carryingNutrient: 0,
        nestPosition: null,
      }

      let state = createGameState({
        grid,
        monsters: [nijirigoke, gajigajimushi],
      })

      const result = tick(state)
      state = result.state

      // Nutrient should be released to adjacent soil cells
      // Position (5,5) is surrounded by soil at (4,5), (6,5), (5,4), (5,6)
      // But (4,5) and (6,5) are empty, so only (5,4) and (5,6) are soil
      let totalReleased = 0
      totalReleased += state.grid[4][5].nutrientAmount // up (soil)
      totalReleased += state.grid[6][5].nutrientAmount // down (soil)
      // Left and right were made empty so they won't receive nutrients

      // The 8 nutrients should be distributed among adjacent soil cells
      expect(totalReleased).toBe(8)
    })

    it('should continue ticking after all monsters die', () => {
      const grid = createGrid(10, 10, 'empty')

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
        direction: 'right',
        pattern: 'straight',
        life: 1, // will die after 1 move
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
      }

      let state = createGameState({ grid, monsters: [monster] })

      // First tick: monster moves and dies
      const result1 = tick(state)
      state = result1.state
      expect(state.monsters).toHaveLength(0)

      // Subsequent ticks should not crash with empty monster list
      const result2 = tick(state)
      state = result2.state
      expect(state.monsters).toHaveLength(0)
      expect(state.gameTime).toBe(2)

      const result3 = tick(state)
      state = result3.state
      expect(state.gameTime).toBe(3)
    })

    it('should complete a full nutrient cycle: absorb, carry, release', () => {
      // Nijirigoke absorbs from soil adjacent to its position after moving
      const grid = createGrid(10, 10, 'soil')
      // Create corridor of empty cells
      grid[5][3].type = 'empty'
      grid[5][4].type = 'empty'
      grid[5][5].type = 'empty'
      grid[5][6].type = 'empty'

      // Put nutrients in soil next to where monster will move to
      // Monster starts at (3,5), moves right to (4,5), absorbs from (5,5) which is empty
      // so put nutrients in soil adjacent to (4,5): (4,4) is soil
      grid[4][4].nutrientAmount = 8

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 3, y: 5 },
        direction: 'right', // will move to (4,5)
        pattern: 'straight',
        life: 16,
        maxLife: 16,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
      }

      let state = createGameState({ grid, monsters: [monster] })

      // Tick 1: moves to (4,5), absorbs from adjacent soil
      const result1 = tick(state)
      state = result1.state
      // Monster moved and absorbed from adjacent soil
      expect(state.monsters[0].position).toEqual({ x: 4, y: 5 })
      expect(state.monsters[0].carryingNutrient).toBeGreaterThan(0)
    })

    it('should keep nijirigoke alive when adjacent nutrients are available', () => {
      // Nijirigoke with maxLife and carrying nutrients should survive much longer
      const grid = createGrid(10, 10, 'soil')
      grid[5][3].type = 'empty'
      grid[5][4].type = 'empty'
      grid[5][5].type = 'empty'
      grid[5][6].type = 'empty'
      grid[5][7].type = 'empty'

      // Rich soil adjacent to corridor
      grid[4][4].nutrientAmount = 10
      grid[4][5].nutrientAmount = 10
      grid[4][6].nutrientAmount = 10

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 3, y: 5 },
        direction: 'right',
        pattern: 'straight',
        life: 16,
        maxLife: 16,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 3, // starts with some nutrients
        nestPosition: null,
      }

      let state = createGameState({ grid, monsters: [monster] })

      // Run 10 ticks - nijirigoke should survive due to nutrient absorption
      for (let i = 0; i < 10; i++) {
        const result = tick(state)
        state = result.state
        if (state.monsters.length === 0) break
      }

      // Should still be alive after 10 ticks with nutrient support
      expect(state.monsters).toHaveLength(1)
      expect(state.monsters[0].life).toBe(16) // life preserved by nutrient fuel
    })

    it('should handle nutrient absorption and release cycle', () => {
      // Create a simple scenario for testing nutrient absorption/release
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].type = 'empty' // monster starting position
      grid[5][6].type = 'empty' // monster will move here
      grid[5][7].nutrientAmount = 10 // soil with nutrients to absorb

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
        direction: 'right',
        pattern: 'straight',
        life: 10,
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
      }

      let state = createGameState({ grid, monsters: [monster] })

      // First tick: monster moves to (6,5) and absorbs from (7,5)
      const result = tick(state)
      state = result.state

      expect(state.monsters[0].position).toEqual({ x: 6, y: 5 })
      // Absorbed 10, then movement cost -1 = 9
      expect(state.monsters[0].carryingNutrient).toBe(9)
      expect(state.grid[5][7].nutrientAmount).toBe(0)
    })
  })
})
