import { describe, it, expect } from 'vitest'
import type { Cell, Monster } from '../types'
import {
  getForwardPosition,
  isValidMove,
  getTurnDirections,
  handleWallCollision,
  calculateStraightMove,
} from './straight'

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0 }))
  )
}

function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'nijirigoke',
    position: { x: 2, y: 2 },
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

describe('Straight Movement', () => {
  describe('getForwardPosition', () => {
    it('should return position above for up direction', () => {
      expect(getForwardPosition({ x: 5, y: 5 }, 'up')).toEqual({ x: 5, y: 4 })
    })

    it('should return position below for down direction', () => {
      expect(getForwardPosition({ x: 5, y: 5 }, 'down')).toEqual({ x: 5, y: 6 })
    })

    it('should return position to left for left direction', () => {
      expect(getForwardPosition({ x: 5, y: 5 }, 'left')).toEqual({ x: 4, y: 5 })
    })

    it('should return position to right for right direction', () => {
      expect(getForwardPosition({ x: 5, y: 5 }, 'right')).toEqual({ x: 6, y: 5 })
    })
  })

  describe('isValidMove', () => {
    it('should return true for empty cell', () => {
      const grid = createGrid(5, 5, 'empty')
      expect(isValidMove({ x: 2, y: 2 }, grid)).toBe(true)
    })

    it('should return false for wall', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[2][2].type = 'wall'
      expect(isValidMove({ x: 2, y: 2 }, grid)).toBe(false)
    })

    it('should return false for out of bounds', () => {
      const grid = createGrid(5, 5, 'empty')
      expect(isValidMove({ x: -1, y: 2 }, grid)).toBe(false)
      expect(isValidMove({ x: 5, y: 2 }, grid)).toBe(false)
      expect(isValidMove({ x: 2, y: -1 }, grid)).toBe(false)
      expect(isValidMove({ x: 2, y: 5 }, grid)).toBe(false)
    })

    it('should return false for soil cell (soil blocks movement)', () => {
      const grid = createGrid(5, 5, 'soil')
      expect(isValidMove({ x: 2, y: 2 }, grid)).toBe(false)
    })
  })

  describe('getTurnDirections', () => {
    it('should return correct turns for up direction', () => {
      const turns = getTurnDirections('up')
      expect(turns.left).toBe('left')
      expect(turns.right).toBe('right')
      expect(turns.back).toBe('down')
    })

    it('should return correct turns for right direction', () => {
      const turns = getTurnDirections('right')
      expect(turns.left).toBe('up')
      expect(turns.right).toBe('down')
      expect(turns.back).toBe('left')
    })
  })

  describe('handleWallCollision', () => {
    it('should choose from available directions', () => {
      const grid = createGrid(5, 5, 'empty')
      // Create walls to block some directions
      grid[2][3].type = 'wall' // right blocked (forward)
      grid[1][2].type = 'wall' // up blocked (left of right)
      grid[3][2].type = 'wall' // down blocked (right of right)

      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })
      const newDir = handleWallCollision(monster, grid, () => 0)

      // Only back (left) should be available
      expect(newDir).toBe('left')
    })

    it('should randomly choose when multiple options available', () => {
      const grid = createGrid(5, 5, 'empty')
      const monster = createMonster({ direction: 'right', position: { x: 2, y: 2 } })

      // Random returns 0 -> first option
      const newDir1 = handleWallCollision(monster, grid, () => 0)
      expect(['up', 'down', 'left']).toContain(newDir1)

      // Random returns 0.99 -> last option
      const newDir2 = handleWallCollision(monster, grid, () => 0.99)
      expect(['up', 'down', 'left']).toContain(newDir2)
    })
  })

  describe('calculateStraightMove', () => {
    it('should move forward when path is clear', () => {
      const grid = createGrid(5, 5, 'empty')
      const monster = createMonster({ position: { x: 2, y: 2 }, direction: 'right' })

      const result = calculateStraightMove(monster, grid)

      expect(result.position).toEqual({ x: 3, y: 2 })
      expect(result.direction).toBe('right')
    })

    it('should turn when hitting wall', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[2][3].type = 'wall' // wall in front

      const monster = createMonster({ position: { x: 2, y: 2 }, direction: 'right' })
      const result = calculateStraightMove(monster, grid, () => 0)

      expect(result.position).toEqual({ x: 2, y: 2 }) // stays in place
      expect(result.direction).not.toBe('right') // turned
    })

    it('should turn when hitting soil', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[2][3].type = 'soil' // soil in front

      const monster = createMonster({ position: { x: 2, y: 2 }, direction: 'right' })
      const result = calculateStraightMove(monster, grid, () => 0)

      expect(result.position).toEqual({ x: 2, y: 2 }) // stays in place
      expect(result.direction).not.toBe('right') // turned
    })
  })
})
