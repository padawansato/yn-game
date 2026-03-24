import { describe, it, expect } from 'vitest'
import type { Cell, Monster } from '../types'
import { calculateRefractionMove } from './refraction'

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0, magicAmount: 0 }))
  )
}

function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'gajigajimushi',
    position: { x: 2, y: 2 },
    direction: 'right',
    pattern: 'refraction',
    phase: 'larva' as const,
    phaseTickCounter: 0,
    life: 30,
    maxLife: 30,
    attack: 3,
    predationTargets: ['nijirigoke'],
    carryingNutrient: 0,
    nestPosition: null,
    nestOrientation: null,
    ...overrides,
  }
}

describe('Refraction Movement', () => {
  describe('calculateRefractionMove', () => {
    it('should turn left when only left is available', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[3][2].type = 'wall' // block right turn (down)
      grid[2][3].type = 'wall' // block forward (right)

      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })
      const result = calculateRefractionMove(monster, grid)

      expect(result.direction).toBe('up')
      expect(result.position).toEqual({ x: 2, y: 1 })
    })

    it('should turn right when only right is available', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[1][2].type = 'wall' // block left turn (up)
      grid[2][3].type = 'wall' // block forward (right)

      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })
      const result = calculateRefractionMove(monster, grid)

      expect(result.direction).toBe('down')
      expect(result.position).toEqual({ x: 2, y: 3 })
    })

    it('should randomly choose when both turns available', () => {
      const grid = createGrid(5, 5, 'empty')
      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })

      // Random returns 0 -> left
      const result1 = calculateRefractionMove(monster, grid, () => 0)
      expect(result1.direction).toBe('up')

      // Random returns 0.99 -> right
      const result2 = calculateRefractionMove(monster, grid, () => 0.99)
      expect(result2.direction).toBe('down')
    })

    it('should go forward when no turn possible', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[1][2].type = 'wall' // block left turn (up)
      grid[3][2].type = 'wall' // block right turn (down)

      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })
      const result = calculateRefractionMove(monster, grid)

      expect(result.direction).toBe('right')
      expect(result.position).toEqual({ x: 3, y: 2 })
    })

    it('should U-turn when stuck', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[1][2].type = 'wall' // block left turn (up)
      grid[3][2].type = 'wall' // block right turn (down)
      grid[2][3].type = 'wall' // block forward (right)

      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })
      const result = calculateRefractionMove(monster, grid)

      expect(result.direction).toBe('left')
      expect(result.position).toEqual({ x: 1, y: 2 })
    })

    it('should stay in place when completely surrounded', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[1][2].type = 'wall' // up
      grid[3][2].type = 'wall' // down
      grid[2][1].type = 'wall' // left
      grid[2][3].type = 'wall' // right

      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })
      const result = calculateRefractionMove(monster, grid)

      expect(result.position).toEqual({ x: 2, y: 2 })
    })

    it('should prioritize turns over forward movement', () => {
      const grid = createGrid(5, 5, 'empty')
      // All directions open, should turn not go forward
      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })
      const result = calculateRefractionMove(monster, grid, () => 0)

      expect(result.direction).not.toBe('right')
      expect(['up', 'down']).toContain(result.direction)
    })
  })
})
