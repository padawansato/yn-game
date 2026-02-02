import { describe, it, expect, beforeEach } from 'vitest'
import type { Cell, GameState, Monster, Nutrient } from './types'
import {
  initializeNutrients,
  depleteOnDig,
  pickupNutrient,
  depositNutrient,
  getTotalNutrients,
  isWorldDying,
  resetNutrientIdCounter,
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
    position: { x: 0, y: 0 },
    direction: 'right',
    pattern: 'straight',
    life: 10,
    maxLife: 10,
    attack: 0,
    predationTargets: [],
    carryingNutrient: null,
    nestPosition: null,
    ...overrides,
  }
}

function createNutrient(overrides: Partial<Nutrient> = {}): Nutrient {
  return {
    id: 'nutrient-1',
    position: { x: 0, y: 0 },
    amount: 5,
    carriedBy: null,
    ...overrides,
  }
}

describe('Nutrient System', () => {
  beforeEach(() => {
    resetNutrientIdCounter()
  })

  describe('initializeNutrients', () => {
    it('should distribute nutrients evenly across soil cells', () => {
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

  describe('pickupNutrient', () => {
    it('should allow Nijirigoke to pick up nutrient', () => {
      const monster = createMonster()
      const nutrient = createNutrient()

      const result = pickupNutrient(monster, nutrient)

      expect(result.monster.carryingNutrient).toBe('nutrient-1')
      expect(result.nutrient.carriedBy).toBe('monster-1')
    })

    it('should not pick up if already carrying', () => {
      const monster = createMonster({ carryingNutrient: 'other-nutrient' })
      const nutrient = createNutrient()

      const result = pickupNutrient(monster, nutrient)

      expect(result.monster.carryingNutrient).toBe('other-nutrient')
      expect(result.nutrient.carriedBy).toBeNull()
    })
  })

  describe('depositNutrient', () => {
    it('should deposit nutrient at monster position', () => {
      const monster = createMonster({
        position: { x: 5, y: 3 },
        carryingNutrient: 'nutrient-1',
      })
      const nutrients = [createNutrient({ id: 'nutrient-1', position: { x: 0, y: 0 } })]

      const result = depositNutrient(monster, nutrients)

      expect(result.monster.carryingNutrient).toBeNull()
      expect(result.nutrients[0].position).toEqual({ x: 5, y: 3 })
      expect(result.nutrients[0].carriedBy).toBeNull()
    })

    it('should do nothing if not carrying nutrient', () => {
      const monster = createMonster({ carryingNutrient: null })
      const nutrients = [createNutrient()]

      const result = depositNutrient(monster, nutrients)

      expect(result.monster.carryingNutrient).toBeNull()
      expect(result.nutrients[0].position).toEqual({ x: 0, y: 0 })
    })
  })

  describe('getTotalNutrients', () => {
    it('should count nutrients in grid and entities', () => {
      const grid = createGrid(2, 2, 'soil')
      grid[0][0].nutrientAmount = 10
      grid[1][1].nutrientAmount = 20

      const state: GameState = {
        grid,
        monsters: [],
        nutrients: [createNutrient({ amount: 5 })],
        totalInitialNutrients: 100,
      }

      const total = getTotalNutrients(state)
      expect(total).toBe(35) // 10 + 20 + 5
    })
  })

  describe('isWorldDying', () => {
    it('should return true when nutrients below threshold', () => {
      const state: GameState = {
        grid: createGrid(1, 1),
        monsters: [],
        nutrients: [createNutrient({ amount: 5 })],
        totalInitialNutrients: 100,
      }

      expect(isWorldDying(state, 0.1)).toBe(true) // 5 < 100 * 0.1
    })

    it('should return false when nutrients above threshold', () => {
      const state: GameState = {
        grid: createGrid(1, 1),
        monsters: [],
        nutrients: [createNutrient({ amount: 50 })],
        totalInitialNutrients: 100,
      }

      expect(isWorldDying(state, 0.1)).toBe(false) // 50 >= 100 * 0.1
    })
  })
})
