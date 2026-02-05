import { describe, it, expect } from 'vitest'
import type { Cell, GameState, Monster } from './types'
import {
  initializeNutrients,
  depleteOnDig,
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
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0 }))
  )
}

function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'nijirigoke',
    position: { x: 1, y: 1 },
    direction: 'right',
    pattern: 'straight',
    life: 10,
    maxLife: 10,
    attack: 0,
    predationTargets: [],
    carryingNutrient: 0,
    nestPosition: null,
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

  describe('depleteOnDig', () => {
    it('should lose 30% of nutrients when digging', () => {
      const available = depleteOnDig(100)
      expect(available).toBe(70)
    })

    it('should floor the result', () => {
      const available = depleteOnDig(10)
      expect(available).toBe(7)
    })

    it('should return 0 for 0 nutrients', () => {
      const available = depleteOnDig(0)
      expect(available).toBe(0)
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
        carryingNutrient: 5, // >= NUTRIENT_RELEASE_THRESHOLD (2)
      })
      const result = releaseNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(1) // keeps 1
      // getAdjacentSoilCells returns in order: up, down, left, right
      // So first adjacent soil is at (1, 0) = grid[0][1]
      expect(result.grid[0][1].nutrientAmount).toBe(4) // released 4 (5-1)
    })

    it('should not release if below threshold', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 1, // < NUTRIENT_RELEASE_THRESHOLD (2)
      })
      const result = releaseNutrient(monster, grid)

      expect(result.monster.carryingNutrient).toBe(1)
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

    it('should cap soil nutrients at 100', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'
      // First adjacent soil is at (1, 0) = grid[0][1] (up direction)
      grid[0][1].nutrientAmount = 95 // already high

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 10,
      })
      const result = releaseNutrient(monster, grid)

      expect(result.grid[0][1].nutrientAmount).toBe(100) // capped
      expect(result.monster.carryingNutrient).toBe(1)
    })
  })

  describe('releaseNutrientsOnDeath', () => {
    it('should distribute nutrients to adjacent soil cells', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 8,
      })
      const newGrid = releaseNutrientsOnDeath(monster, grid)

      // 8 nutrients distributed among 4 adjacent cells = 2 each
      expect(newGrid[0][1].nutrientAmount).toBe(2) // up
      expect(newGrid[2][1].nutrientAmount).toBe(2) // down
      expect(newGrid[1][0].nutrientAmount).toBe(2) // left
      expect(newGrid[1][2].nutrientAmount).toBe(2) // right
    })

    it('should handle remainder distribution', () => {
      const grid = createGrid(3, 3, 'soil')
      grid[1][1].type = 'empty'

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 5, // 5 / 4 = 1 with remainder 1
      })
      const newGrid = releaseNutrientsOnDeath(monster, grid)

      let total = 0
      total += newGrid[0][1].nutrientAmount
      total += newGrid[2][1].nutrientAmount
      total += newGrid[1][0].nutrientAmount
      total += newGrid[1][2].nutrientAmount

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

    it('should lose nutrients if no adjacent soil', () => {
      const grid = createGrid(3, 3, 'empty')

      const monster = createMonster({
        position: { x: 1, y: 1 },
        carryingNutrient: 10,
      })
      const newGrid = releaseNutrientsOnDeath(monster, grid)

      // No soil, nutrients are lost
      let total = 0
      for (const row of newGrid) {
        for (const cell of row) {
          total += cell.nutrientAmount
        }
      }
      expect(total).toBe(0)
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
        totalInitialNutrients: 100,
        digPower: 100,
        gameTime: 0,
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
        totalInitialNutrients: 100,
        digPower: 100,
        gameTime: 0,
      }

      expect(isWorldDying(state, 0.1)).toBe(true) // 5 < 100 * 0.1
    })

    it('should return false when nutrients above threshold', () => {
      const grid = createGrid(1, 1, 'soil')
      grid[0][0].nutrientAmount = 50

      const state: GameState = {
        grid,
        monsters: [],
        totalInitialNutrients: 100,
        digPower: 100,
        gameTime: 0,
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
