import { describe, it, expect } from 'vitest'
import type { Cell, Monster } from '../types'
import {
  isAdjacentToNest,
  getPatrolPositions,
  canEstablishNest,
  getDirectionToward,
  calculateStationaryMove,
} from './stationary'

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0 }))
  )
}

function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'lizardman',
    position: { x: 2, y: 2 },
    direction: 'right',
    pattern: 'stationary',
    life: 80,
    maxLife: 80,
    attack: 8,
    predationTargets: ['nijirigoke', 'gajigajimushi'],
    carryingNutrient: null,
    nestPosition: null,
    ...overrides,
  }
}

describe('Stationary Movement', () => {
  describe('isAdjacentToNest', () => {
    it('should return true for adjacent positions', () => {
      const nest = { x: 2, y: 2 }
      expect(isAdjacentToNest({ x: 1, y: 1 }, nest)).toBe(true)
      expect(isAdjacentToNest({ x: 2, y: 1 }, nest)).toBe(true)
      expect(isAdjacentToNest({ x: 3, y: 3 }, nest)).toBe(true)
    })

    it('should return false for nest position itself', () => {
      const nest = { x: 2, y: 2 }
      expect(isAdjacentToNest({ x: 2, y: 2 }, nest)).toBe(false)
    })

    it('should return false for non-adjacent positions', () => {
      const nest = { x: 2, y: 2 }
      expect(isAdjacentToNest({ x: 0, y: 0 }, nest)).toBe(false)
      expect(isAdjacentToNest({ x: 4, y: 2 }, nest)).toBe(false)
    })
  })

  describe('getPatrolPositions', () => {
    it('should return all 8 adjacent positions in open area', () => {
      const grid = createGrid(5, 5, 'empty')
      const positions = getPatrolPositions({ x: 2, y: 2 }, grid)
      expect(positions.length).toBe(8)
    })

    it('should exclude wall positions', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[1][1].type = 'wall'
      grid[1][2].type = 'wall'

      const positions = getPatrolPositions({ x: 2, y: 2 }, grid)
      expect(positions.length).toBe(6)
    })

    it('should handle corner position', () => {
      const grid = createGrid(5, 5, 'empty')
      const positions = getPatrolPositions({ x: 0, y: 0 }, grid)
      expect(positions.length).toBe(3) // right, down, diagonal
    })
  })

  describe('canEstablishNest', () => {
    it('should return true for open area', () => {
      const grid = createGrid(5, 5, 'empty')
      expect(canEstablishNest({ x: 2, y: 2 }, grid)).toBe(true)
    })

    it('should return false for cramped area', () => {
      const grid = createGrid(5, 5, 'empty')
      // Surround with walls
      grid[1][1].type = 'wall'
      grid[1][2].type = 'wall'
      grid[1][3].type = 'wall'
      grid[2][1].type = 'wall'
      grid[2][3].type = 'wall'

      expect(canEstablishNest({ x: 2, y: 2 }, grid)).toBe(false)
    })
  })

  describe('getDirectionToward', () => {
    it('should return right for positive x difference', () => {
      expect(getDirectionToward({ x: 0, y: 0 }, { x: 2, y: 0 })).toBe('right')
    })

    it('should return left for negative x difference', () => {
      expect(getDirectionToward({ x: 2, y: 0 }, { x: 0, y: 0 })).toBe('left')
    })

    it('should return down for positive y difference', () => {
      expect(getDirectionToward({ x: 0, y: 0 }, { x: 0, y: 2 })).toBe('down')
    })

    it('should return up for negative y difference', () => {
      expect(getDirectionToward({ x: 0, y: 2 }, { x: 0, y: 0 })).toBe('up')
    })

    it('should prioritize larger difference', () => {
      expect(getDirectionToward({ x: 0, y: 0 }, { x: 2, y: 1 })).toBe('right')
      expect(getDirectionToward({ x: 0, y: 0 }, { x: 1, y: 2 })).toBe('down')
    })
  })

  describe('calculateStationaryMove', () => {
    it('should establish nest in open area', () => {
      const grid = createGrid(5, 5, 'empty')
      const monster = createMonster({ position: { x: 2, y: 2 }, nestPosition: null })

      const result = calculateStationaryMove(monster, grid, () => 0)

      expect(result.nestPosition).toEqual({ x: 2, y: 2 })
    })

    it('should patrol around established nest', () => {
      const grid = createGrid(5, 5, 'empty')
      const monster = createMonster({
        position: { x: 2, y: 2 },
        nestPosition: { x: 2, y: 2 },
      })

      const result = calculateStationaryMove(monster, grid, () => 0)

      expect(result.nestPosition).toEqual({ x: 2, y: 2 })
      expect(isAdjacentToNest(result.position, { x: 2, y: 2 })).toBe(true)
    })

    it('should use straight fallback when cannot establish nest', () => {
      const grid = createGrid(5, 5, 'empty')
      // Surround with walls
      grid[1][1].type = 'wall'
      grid[1][2].type = 'wall'
      grid[1][3].type = 'wall'
      grid[2][1].type = 'wall'
      grid[2][3].type = 'wall'

      const monster = createMonster({
        position: { x: 2, y: 2 },
        direction: 'down',
        nestPosition: null,
      })

      const result = calculateStationaryMove(monster, grid, () => 0)

      expect(result.nestPosition).toBeNull()
      expect(result.position).toEqual({ x: 2, y: 3 }) // moved forward
    })

    it('should turn when blocked in straight fallback', () => {
      const grid = createGrid(5, 5, 'wall')
      grid[2][2].type = 'empty' // current position
      grid[2][1].type = 'empty' // left

      const monster = createMonster({
        position: { x: 2, y: 2 },
        direction: 'down',
        nestPosition: null,
      })

      const result = calculateStationaryMove(monster, grid, () => 0)

      expect(result.nestPosition).toBeNull()
      expect(result.position).toEqual({ x: 2, y: 2 }) // stayed, turned
    })
  })
})
