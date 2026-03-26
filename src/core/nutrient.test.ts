import { describe, it, expect } from 'vitest'
import type { Cell, GameState, Monster } from './types'
import {
  initializeNutrients,
  getTotalNutrients,
  isWorldDying,
  exponentialRandom,
  getAdjacentSoilCells,
  absorbNutrient,
  releaseNutrient,
  releaseNutrientsOnDeath,
} from './nutrient'

function createGrid(width: number, height: number, type: Cell['type'] = 'soil'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0, magicAmount: 0 }))
  )
}

function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'nijirigoke',
    position: { x: 1, y: 1 },
    direction: 'right',
    pattern: 'straight',
    phase: 'mobile' as const,
    phaseTickCounter: 0,
    life: 10,
    maxLife: 10,
    attack: 0,
    predationTargets: [],
    carryingNutrient: 0,
    nestPosition: null,
    nestOrientation: null,
    ...overrides,
  }
}

describe('Nutrient System', () => {
  describe('initializeNutrients', () => {
    it('should distribute nutrients across soil cells', () => {
      const grid = createGrid(3, 3, 'soil')
      const { grid: newGrid } = initializeNutrients(grid, 90)

      let total = 0
      for (const row of newGrid) {
        for (const cell of row) {
          total += cell.nutrientAmount
        }
      }

      expect(total).toBe(90)
    })

    it('should not distribute nutrients to non-soil cells', () => {
      const grid = createGrid(3, 3, 'empty')
      const { grid: newGrid } = initializeNutrients(grid, 100)

      let total = 0
      for (const row of newGrid) {
        for (const cell of row) {
          total += cell.nutrientAmount
        }
      }

      expect(total).toBe(0)
    })

    it('should handle mixed grid', () => {
      const grid = createGrid(2, 2, 'soil')
      grid[0][0].type = 'wall'
      grid[1][1].type = 'empty'

      const { grid: newGrid } = initializeNutrients(grid, 20)

      expect(newGrid[0][0].nutrientAmount).toBe(0) // wall
      expect(newGrid[1][1].nutrientAmount).toBe(0) // empty
      // Two soil cells should share 20 nutrients
      expect(newGrid[0][1].nutrientAmount + newGrid[1][0].nutrientAmount).toBe(20)
    })
  })

  describe('getAdjacentSoilCells', () => {
    it('should return adjacent soil cells', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty' // center is empty

      const adjacent = getAdjacentSoilCells({ x: 1, y: 1 }, grid)

      expect(adjacent).toHaveLength(4)
      expect(adjacent).toContainEqual({ x: 1, y: 0 }) // up
      expect(adjacent).toContainEqual({ x: 1, y: 2 }) // down
      expect(adjacent).toContainEqual({ x: 0, y: 1 }) // left
      expect(adjacent).toContainEqual({ x: 2, y: 1 }) // right
    })

    it('should not include non-soil cells', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[0][1].type = 'wall' // up is wall
      grid[2][1].type = 'empty' // down is empty

      const adjacent = getAdjacentSoilCells({ x: 1, y: 1 }, grid)

      expect(adjacent).toHaveLength(2)
      expect(adjacent).toContainEqual({ x: 0, y: 1 }) // left
      expect(adjacent).toContainEqual({ x: 2, y: 1 }) // right
    })

    it('should handle edge positions', () => {
      const grid = createGrid(3, 3, 'soil')

      const adjacent = getAdjacentSoilCells({ x: 0, y: 0 }, grid)

      expect(adjacent).toHaveLength(2)
      expect(adjacent).toContainEqual({ x: 1, y: 0 }) // right
      expect(adjacent).toContainEqual({ x: 0, y: 1 }) // down
    })
  })

  describe('absorbNutrient', () => {
    it('should absorb nutrients from adjacent soil', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty' // monster position
      grid[1][2].nutrientAmount = 5 // soil to the right has nutrients

      const monster = createMonster({ position: { x: 1, y: 1 }, direction: 'right' })
      const result = absorbNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(5)
      expect(result.grid[1][2].nutrientAmount).toBe(0)
    })

    it('should prefer facing direction', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty' // monster position
      grid[1][0].nutrientAmount = 10 // left has more
      grid[1][2].nutrientAmount = 3 // right (facing) has less

      const monster = createMonster({ position: { x: 1, y: 1 }, direction: 'right' })
      const result = absorbNutrient(monster, grid)

      // Should absorb from facing direction first
      expect(result.monster.carryingNutrient).toBe(3)
      expect(result.grid[1][2].nutrientAmount).toBe(0)
      expect(result.grid[1][0].nutrientAmount).toBe(10)
    })

    it('should not absorb if at capacity', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'
      grid[1][2].nutrientAmount = 5

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 10, // at capacity (NUTRIENT_CARRY_CAPACITY = 10)
      })
      const result = absorbNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(10)
      expect(result.grid[1][2].nutrientAmount).toBe(5)
    })

    it('should not absorb for non-nijirigoke', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'
      grid[1][2].nutrientAmount = 5

      const monster = createMonster({
        position: { x: 1, y: 1 },
        type: 'gajigajimushi',
        pattern: 'refraction',
      })
      const result = absorbNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(0)
      expect(result.grid[1][2].nutrientAmount).toBe(5)
    })
  })

  describe('releaseNutrient', () => {
    it('should release nutrients when carrying >= threshold', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        direction: 'right',
        carryingNutrient: 5, // >= NUTRIENT_RELEASE_THRESHOLD (4)
      })
      const result = releaseNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(1) // keeps 1
      // Facing direction is right, so release to (2, 1) = grid[1][2]
      expect(result.grid[1][2].nutrientAmount).toBe(4) // released 4 (5-1)
    })

    it('should not release if below threshold', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 1, // < NUTRIENT_RELEASE_THRESHOLD (4)
      })
      const result = releaseNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(1)
    })

    it('should not release when carrying exactly 3 (below threshold of 4)', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        direction: 'right',
        carryingNutrient: 3,
      })
      const result = releaseNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(3) // no release
    })

    it('should release when carrying exactly 4 (at threshold)', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        direction: 'right',
        carryingNutrient: 4,
      })
      const result = releaseNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(1) // released 3, keeps 1
      expect(result.grid[1][2].nutrientAmount).toBe(3)
    })

    it('should not release for non-nijirigoke', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        type: 'gajigajimushi',
        pattern: 'refraction',
        carryingNutrient: 5,
      })
      const result = releaseNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(5)
    })

    it('should allow nutrients above MAX_NUTRIENT_PER_CELL (conservation law priority)', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'
      // Facing direction is right, so release to (2, 1) = grid[1][2]
      grid[1][2].nutrientAmount = 95 // already high

      const monster = createMonster({
        position: { x: 1, y: 1 },
        direction: 'right',
        carryingNutrient: 10,
      })
      const result = releaseNutrient(monster, grid)

      // Conservation law: 95 + 9 = 104 (no cap, nutrients preserved)
      expect(result.grid[1][2].nutrientAmount).toBe(104)
      expect(result.monster.carryingNutrient).toBe(1)
    })
  })

  describe('releaseNutrientsOnDeath', () => {
    it('should distribute nutrients to surrounding 9 cells (soil and empty)', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty' // center where monster dies

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 9,
      })
      const newGrid = releaseNutrientsOnDeath(monster, grid)

      // 9 nutrients distributed among 9 cells (8 soil + 1 empty center) = 1 each
      let total = 0
      for (const row of newGrid) {
        for (const cell of row) {
          total += cell.nutrientAmount
        }
      }
      expect(total).toBe(9)
    })

    it('should handle remainder distribution across 9 cells', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 5, // 5 / 9 = 0 with remainder 5
      })
      const newGrid = releaseNutrientsOnDeath(monster, grid)

      let total = 0
      for (const row of newGrid) {
        for (const cell of row) {
          total += cell.nutrientAmount
        }
      }
      expect(total).toBe(5)
    })

    it('should do nothing if no nutrients', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 0,
      })
      const newGrid = releaseNutrientsOnDeath(monster, grid)

      expect(newGrid).toBe(grid) // same reference
    })

    it('should distribute to empty cells (conservation law)', () => {
      const grid = createGrid(3, 3, 'empty')

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 10,
      })
      const newGrid = releaseNutrientsOnDeath(monster, grid)

      // Empty cells can hold nutrients (conservation law)
      let total = 0
      for (const row of newGrid) {
        for (const cell of row) {
          total += cell.nutrientAmount
        }
      }
      expect(total).toBe(10)
    })

    it('should exclude wall cells from distribution', () => {
      const grid = createGrid(3, 3, 'wall')
      grid[1][1].type = 'empty' // center
      grid[0][1].type = 'soil' // only one non-wall neighbor

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 6,
      })
      const newGrid = releaseNutrientsOnDeath(monster, grid)

      // 2 non-wall cells (center empty + up soil) → 3 each
      expect(newGrid[0][1].nutrientAmount).toBe(3) // soil up
      expect(newGrid[1][1].nutrientAmount).toBe(3) // empty center
    })
  })

  describe('getTotalNutrients', () => {
    it('should count nutrients in grid and monsters', () => {
      const grid = createGrid(2, 2, 'soil')
      grid[0][0].nutrientAmount = 10
      grid[1][1].nutrientAmount = 20

      const state: GameState = {
        grid,
        monsters: [
          createMonster({ carryingNutrient: 5 }),
          createMonster({ id: 'monster-2', carryingNutrient: 3 }),
        ],
        heroes: [],
        entrancePosition: { x: 0, y: 0 },
        demonLordPosition: { x: 1, y: 1 },
        heroSpawnConfig: { partySize: 1, spawnStartTick: 100, spawnInterval: 10, heroesSpawned: 0 },
        totalInitialNutrients: 100,
        digPower: 100,
        gameTime: 0,
        nextMonsterId: 0,
        nextHeroId: 0,
        isGameOver: false,
      }

      const total = getTotalNutrients(state)
      expect(total).toBe(38) // 10 + 20 + 5 + 3
    })
  })

  describe('isWorldDying', () => {
    it('should return true when nutrients below threshold', () => {
      const grid = createGrid(1, 1, 'soil')
      grid[0][0].nutrientAmount = 5

      const state: GameState = {
        grid,
        monsters: [],
        heroes: [],
        entrancePosition: { x: 0, y: 0 },
        demonLordPosition: { x: 0, y: 0 },
        heroSpawnConfig: { partySize: 1, spawnStartTick: 100, spawnInterval: 10, heroesSpawned: 0 },
        totalInitialNutrients: 100,
        digPower: 100,
        gameTime: 0,
        nextMonsterId: 0,
        nextHeroId: 0,
        isGameOver: false,
      }

      expect(isWorldDying(state, 0.1)).toBe(true) // 5 < 100 * 0.1
    })

    it('should return false when nutrients above threshold', () => {
      const grid = createGrid(1, 1, 'soil')
      grid[0][0].nutrientAmount = 50

      const state: GameState = {
        grid,
        monsters: [],
        heroes: [],
        entrancePosition: { x: 0, y: 0 },
        demonLordPosition: { x: 0, y: 0 },
        heroSpawnConfig: { partySize: 1, spawnStartTick: 100, spawnInterval: 10, heroesSpawned: 0 },
        totalInitialNutrients: 100,
        digPower: 100,
        gameTime: 0,
        nextMonsterId: 0,
        nextHeroId: 0,
        isGameOver: false,
      }

      expect(isWorldDying(state, 0.1)).toBe(false) // 50 >= 100 * 0.1
    })
  })

  describe('exponentialRandom', () => {
    it('should return positive values', () => {
      for (let i = 0; i < 100; i++) {
        const value = exponentialRandom(1)
        expect(value).toBeGreaterThanOrEqual(0)
      }
    })

    it('should scale with scale parameter', () => {
      const mockRandom = () => 0.5
      const small = exponentialRandom(1, mockRandom)
      const large = exponentialRandom(10, mockRandom)
      expect(large).toBeGreaterThan(small)
    })

    it('should return non-negative when u = 0', () => {
      const value = exponentialRandom(1, () => 0)
      expect(value).toBeGreaterThanOrEqual(0)
    })

    it('should return non-negative when u = 1', () => {
      const value = exponentialRandom(1, () => 1)
      expect(value).toBeGreaterThanOrEqual(0)
    })
  })

  describe('initializeNutrients sparse distribution', () => {
    it('should distribute total nutrients correctly', () => {
      const grid = createGrid(5, 5, 'soil')
      const { grid: newGrid } = initializeNutrients(grid, 500)

      let total = 0
      for (const row of newGrid) {
        for (const cell of row) {
          total += cell.nutrientAmount
        }
      }

      expect(total).toBe(500)
    })

    it('should have sparse distribution (most cells low, few high)', () => {
      const grid = createGrid(10, 10, 'soil')
      const { grid: newGrid } = initializeNutrients(grid, 1000)

      const values: number[] = []
      for (const row of newGrid) {
        for (const cell of row) {
          if (cell.type === 'soil') {
            values.push(cell.nutrientAmount)
          }
        }
      }

      values.sort((a, b) => a - b)

      const mean = values.reduce((sum, v) => sum + v, 0) / values.length
      const median = values[Math.floor(values.length / 2)]

      expect(median).toBeLessThanOrEqual(mean)
    })

    it('should clamp values to 0-100 range', () => {
      const grid = createGrid(5, 5, 'soil')
      const { grid: newGrid } = initializeNutrients(grid, 2500)

      for (const row of newGrid) {
        for (const cell of row) {
          expect(cell.nutrientAmount).toBeGreaterThanOrEqual(0)
          expect(cell.nutrientAmount).toBeLessThanOrEqual(100)
        }
      }
    })

    it('should use randomFn for deterministic testing', () => {
      const grid = createGrid(3, 3, 'soil')
      let callCount = 0
      const mockRandom = () => {
        callCount++
        return 0.5
      }

      initializeNutrients(grid, 90, mockRandom)

      expect(callCount).toBe(9)
    })
  })
})
