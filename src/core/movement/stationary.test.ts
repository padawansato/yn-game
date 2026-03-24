import { describe, it, expect } from 'vitest'
import type { Cell, Monster } from '../types'
import {
  isAdjacentToNest,
  getPatrolPositions,
  canEstablishNest,
  has2x3Space,
  getAdjacentPositions,
  isWithinPatrolRange,
  getDirectionToward,
  calculateStationaryMove,
} from './stationary'
import { NEST_NUTRIENT_COST, NEST_LIFE_COST } from '../constants'

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0, magicAmount: 0 }))
  )
}

function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'lizardman',
    position: { x: 2, y: 2 },
    direction: 'right',
    pattern: 'stationary',
    phase: 'normal' as const,
    phaseTickCounter: 0,
    life: 80,
    maxLife: 80,
    attack: 8,
    predationTargets: ['nijirigoke', 'gajigajimushi'],
    carryingNutrient: 0,
    nestPosition: null,
    nestOrientation: null,
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

  describe('has2x3Space', () => {
    it('should return true for 3x2 horizontal space', () => {
      const grid = createGrid(5, 5, 'wall')
      // Create a 3x2 horizontal space
      grid[2][1].type = 'empty'
      grid[2][2].type = 'empty'
      grid[2][3].type = 'empty'
      grid[3][1].type = 'empty'
      grid[3][2].type = 'empty'
      grid[3][3].type = 'empty'

      expect(has2x3Space({ x: 2, y: 2 }, grid)).toBe(true)
    })

    it('should return true for 2x3 vertical space', () => {
      const grid = createGrid(5, 5, 'wall')
      // Create a 2x3 vertical space
      grid[1][2].type = 'empty'
      grid[1][3].type = 'empty'
      grid[2][2].type = 'empty'
      grid[2][3].type = 'empty'
      grid[3][2].type = 'empty'
      grid[3][3].type = 'empty'

      expect(has2x3Space({ x: 2, y: 2 }, grid)).toBe(true)
    })

    it('should return false for 2x2 space (too small)', () => {
      const grid = createGrid(5, 5, 'wall')
      // Create only a 2x2 space
      grid[2][2].type = 'empty'
      grid[2][3].type = 'empty'
      grid[3][2].type = 'empty'
      grid[3][3].type = 'empty'

      expect(has2x3Space({ x: 2, y: 2 }, grid)).toBe(false)
    })

    it('should return false for L-shaped space (not contiguous rectangle)', () => {
      const grid = createGrid(5, 5, 'wall')
      // Create L-shape, not 2x3
      grid[2][2].type = 'empty'
      grid[2][3].type = 'empty'
      grid[2][4].type = 'empty'
      grid[3][2].type = 'empty'
      grid[4][2].type = 'empty'

      expect(has2x3Space({ x: 2, y: 2 }, grid)).toBe(false)
    })
  })

  describe('canEstablishNest', () => {
    it('should return true for 2x3 or larger open area', () => {
      const grid = createGrid(5, 5, 'empty')
      expect(canEstablishNest({ x: 2, y: 2 }, grid)).toBe(true)
    })

    it('should return false for too small area', () => {
      const grid = createGrid(5, 5, 'wall')
      // Create only 2x2 space - not enough for 2x3
      grid[2][2].type = 'empty'
      grid[2][3].type = 'empty'
      grid[3][2].type = 'empty'
      grid[3][3].type = 'empty'

      expect(canEstablishNest({ x: 2, y: 2 }, grid)).toBe(false)
    })

    it('should return true for exactly 2x3 space', () => {
      const grid = createGrid(5, 5, 'wall')
      // Create exactly 2x3 space
      grid[2][1].type = 'empty'
      grid[2][2].type = 'empty'
      grid[2][3].type = 'empty'
      grid[3][1].type = 'empty'
      grid[3][2].type = 'empty'
      grid[3][3].type = 'empty'

      expect(canEstablishNest({ x: 2, y: 2 }, grid)).toBe(true)
    })
  })

  describe('getAdjacentPositions', () => {
    it('should return 4 adjacent positions in open area', () => {
      const grid = createGrid(5, 5, 'empty')
      const positions = getAdjacentPositions({ x: 2, y: 2 }, grid)
      expect(positions.length).toBe(4)
      expect(positions).toContainEqual({ x: 2, y: 1 }) // up
      expect(positions).toContainEqual({ x: 2, y: 3 }) // down
      expect(positions).toContainEqual({ x: 1, y: 2 }) // left
      expect(positions).toContainEqual({ x: 3, y: 2 }) // right
    })

    it('should exclude wall positions', () => {
      const grid = createGrid(5, 5, 'empty')
      grid[1][2].type = 'wall' // up
      grid[2][3].type = 'wall' // right

      const positions = getAdjacentPositions({ x: 2, y: 2 }, grid)
      expect(positions.length).toBe(2)
      expect(positions).toContainEqual({ x: 2, y: 3 }) // down
      expect(positions).toContainEqual({ x: 1, y: 2 }) // left
    })
  })

  describe('isWithinPatrolRange', () => {
    it('should return true for positions within 2 cells of nest', () => {
      const nest = { x: 5, y: 5 }
      expect(isWithinPatrolRange({ x: 5, y: 5 }, nest)).toBe(true) // nest itself
      expect(isWithinPatrolRange({ x: 6, y: 5 }, nest)).toBe(true) // 1 cell away
      expect(isWithinPatrolRange({ x: 7, y: 5 }, nest)).toBe(true) // 2 cells away
      expect(isWithinPatrolRange({ x: 7, y: 7 }, nest)).toBe(true) // diagonal 2 cells
    })

    it('should return false for positions more than 2 cells from nest', () => {
      const nest = { x: 5, y: 5 }
      expect(isWithinPatrolRange({ x: 8, y: 5 }, nest)).toBe(false) // 3 cells away
      expect(isWithinPatrolRange({ x: 2, y: 5 }, nest)).toBe(false) // 3 cells away
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
    it('should establish nest in open area and stay in place', () => {
      const grid = createGrid(8, 8, 'empty')
      const monster = createMonster({ position: { x: 3, y: 3 }, nestPosition: null, carryingNutrient: NEST_NUTRIENT_COST, life: NEST_LIFE_COST + 1 })

      const result = calculateStationaryMove(monster, grid, [], () => 0)

      // findNestArea returns center of first matching 2x3 pattern
      expect(result.nestPosition).not.toBeNull()
      expect(result.nestOrientation).not.toBeNull()
      expect(result.position).toEqual({ x: 3, y: 3 }) // stays in place when establishing
    })

    it('should NOT establish nest when carryingNutrient < NEST_NUTRIENT_COST', () => {
      const grid = createGrid(8, 8, 'empty')
      const monster = createMonster({
        position: { x: 3, y: 3 },
        nestPosition: null,
        carryingNutrient: 5,
        life: 80,
      })

      const result = calculateStationaryMove(monster, grid, [], () => 0)

      // Should fall back to straight movement, not establish nest
      expect(result.nestPosition).toBeNull()
    })

    it('should NOT establish nest when life <= NEST_LIFE_COST', () => {
      const grid = createGrid(8, 8, 'empty')
      const monster = createMonster({
        position: { x: 3, y: 3 },
        nestPosition: null,
        carryingNutrient: NEST_NUTRIENT_COST,
        life: NEST_LIFE_COST,
      })

      const result = calculateStationaryMove(monster, grid, [], () => 0)

      // Should fall back to straight movement, not establish nest
      expect(result.nestPosition).toBeNull()
    })

    it('should patrol by moving one cell at a time', () => {
      const grid = createGrid(7, 7, 'empty')
      const monster = createMonster({
        position: { x: 3, y: 3 },
        nestPosition: { x: 3, y: 3 },
        nestOrientation: 'horizontal' as const,
      })

      const result = calculateStationaryMove(monster, grid, [], () => 0)

      expect(result.nestPosition).toEqual({ x: 3, y: 3 })
      // Should move to an adjacent cell (up, down, left, or right)
      const dx = Math.abs(result.position.x - monster.position.x)
      const dy = Math.abs(result.position.y - monster.position.y)
      expect(dx + dy).toBe(1) // moved exactly one cell
    })

    it('should stay within patrol range of nest', () => {
      const grid = createGrid(10, 10, 'empty')
      // Monster is at edge of patrol range
      const monster = createMonster({
        position: { x: 7, y: 5 }, // 2 cells away from nest
        nestPosition: { x: 5, y: 5 },
        nestOrientation: 'horizontal' as const,
      })

      const result = calculateStationaryMove(monster, grid, [], () => 0)

      // Should only move to positions within patrol range
      expect(isWithinPatrolRange(result.position, { x: 5, y: 5 })).toBe(true)
    })

    it('should use straight fallback when cannot establish nest', () => {
      const grid = createGrid(5, 5, 'wall')
      // Create only 2x2 space - not enough for 2x3 nest
      grid[2][2].type = 'empty'
      grid[2][3].type = 'empty'
      grid[3][2].type = 'empty'
      grid[3][3].type = 'empty'

      const monster = createMonster({
        position: { x: 2, y: 2 },
        direction: 'right',
        nestPosition: null,
        nestOrientation: null,
      })

      const result = calculateStationaryMove(monster, grid, [], () => 0)

      expect(result.nestPosition).toBeNull()
      expect(result.position).toEqual({ x: 3, y: 2 }) // moved forward (right)
    })

    it('should turn when blocked in straight fallback', () => {
      const grid = createGrid(5, 5, 'wall')
      grid[2][2].type = 'empty' // current position
      grid[2][1].type = 'empty' // left

      const monster = createMonster({
        position: { x: 2, y: 2 },
        direction: 'down',
        nestPosition: null,
        nestOrientation: null,
      })

      const result = calculateStationaryMove(monster, grid, [], () => 0)

      expect(result.nestPosition).toBeNull()
      expect(result.position).toEqual({ x: 2, y: 2 }) // stayed, turned
    })

    it('should prioritize moving toward prey when hungry', () => {
      const grid = createGrid(10, 10, 'empty')
      const lizardman = createMonster({
        position: { x: 5, y: 5 },
        nestPosition: { x: 5, y: 5 },
        nestOrientation: 'horizontal' as const,
        life: 20, // hungry (below 50% of maxLife 80)
        maxLife: 80,
        predationTargets: ['nijirigoke'],
      })

      const prey: Monster = {
        id: 'prey-1',
        type: 'nijirigoke',
        position: { x: 5, y: 3 }, // above (up direction)
        direction: 'down',
        pattern: 'straight',
        life: 10,
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
        phase: 'mobile' as const,
        phaseTickCounter: 0,
      }

      const result = calculateStationaryMove(lizardman, grid, [prey], () => 0)

      // Should move up toward prey
      expect(result.position).toEqual({ x: 5, y: 4 })
      expect(result.direction).toBe('up')
    })

    it('should adopt existing lizardman nest when cannot afford own', () => {
      const grid = createGrid(8, 8, 'empty')
      const poorLizardman = createMonster({
        id: 'poor-lz',
        position: { x: 3, y: 3 },
        nestPosition: null,
        nestOrientation: null,
        carryingNutrient: 5, // < NEST_NUTRIENT_COST
        life: 80,
      })

      const richLizardman = createMonster({
        id: 'rich-lz',
        position: { x: 6, y: 6 },
        nestPosition: { x: 5, y: 5 },
        nestOrientation: 'horizontal' as const,
        carryingNutrient: 20,
        life: 80,
      })

      const result = calculateStationaryMove(poorLizardman, grid, [poorLizardman, richLizardman], () => 0)

      expect(result.nestPosition).toEqual({ x: 5, y: 5 })
      expect(result.nestOrientation).toBe('horizontal')
      expect(result.position).toEqual({ x: 3, y: 3 }) // stays in place
    })

    it('should prefer building own nest when affordable', () => {
      const grid = createGrid(8, 8, 'empty')
      const richLizardman = createMonster({
        id: 'rich-lz',
        position: { x: 3, y: 3 },
        nestPosition: null,
        nestOrientation: null,
        carryingNutrient: NEST_NUTRIENT_COST,
        life: NEST_LIFE_COST + 1,
      })

      const otherLizardman = createMonster({
        id: 'other-lz',
        position: { x: 6, y: 6 },
        nestPosition: { x: 5, y: 5 },
        nestOrientation: 'horizontal' as const,
      })

      const result = calculateStationaryMove(richLizardman, grid, [richLizardman, otherLizardman], () => 0)

      // Should build own nest, NOT adopt the other's
      expect(result.nestPosition).not.toEqual({ x: 5, y: 5 })
      expect(result.nestPosition).not.toBeNull()
    })

    it('should not adopt nest from non-lizardman', () => {
      const grid = createGrid(8, 8, 'empty')
      const poorLizardman = createMonster({
        id: 'poor-lz',
        position: { x: 1, y: 1 },
        nestPosition: null,
        nestOrientation: null,
        carryingNutrient: 5,
        life: 80,
      })

      // A non-lizardman monster that happens to have nest fields set
      const nonLizardman: Monster = {
        id: 'gaji-1',
        type: 'gajigajimushi',
        position: { x: 6, y: 6 },
        direction: 'right',
        pattern: 'refraction',
        phase: 'larva' as const,
        phaseTickCounter: 0,
        life: 10,
        maxLife: 10,
        attack: 3,
        predationTargets: ['nijirigoke'],
        carryingNutrient: 0,
        nestPosition: { x: 5, y: 5 },
        nestOrientation: 'horizontal' as const,
      }

      const result = calculateStationaryMove(poorLizardman, grid, [poorLizardman, nonLizardman], () => 0)

      // Should NOT adopt the gajigajimushi's nest, should fall back to straight movement
      expect(result.nestPosition).toBeNull()
    })

    it('should not chase prey when not hungry', () => {
      const grid = createGrid(10, 10, 'empty')
      const lizardman = createMonster({
        position: { x: 5, y: 5 },
        nestPosition: { x: 5, y: 5 },
        nestOrientation: 'horizontal' as const,
        life: 80, // full health, not hungry
        maxLife: 80,
        predationTargets: ['nijirigoke'],
      })

      const prey: Monster = {
        id: 'prey-1',
        type: 'nijirigoke',
        position: { x: 5, y: 3 }, // above
        direction: 'down',
        pattern: 'straight',
        life: 10,
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
        phase: 'mobile' as const,
        phaseTickCounter: 0,
      }

      // With randomFn returning 0, it should pick first patrol option (up: {x:5,y:4})
      const result = calculateStationaryMove(lizardman, grid, [prey], () => 0)

      // Should move randomly, not necessarily toward prey
      expect(result.nestPosition).toEqual({ x: 5, y: 5 })
    })
  })
})
