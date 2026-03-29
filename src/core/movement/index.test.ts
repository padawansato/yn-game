import { describe, it, expect } from 'vitest'
import type { Cell, Monster } from '../types'
import { isHungry, detectPrey, prioritizePreyDirection, calculateMove } from './index'
import { createDefaultConfig } from '../config'

const config = createDefaultConfig()

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

describe('Hunger System', () => {
  describe('isHungry', () => {
    it('should return true when life below 30% of maxLife', () => {
      const monster = createMonster({ life: 8, maxLife: 30 })
      expect(isHungry(monster, config)).toBe(true)
    })

    it('should return false when life above 30% of maxLife', () => {
      const monster = createMonster({ life: 20, maxLife: 30 })
      expect(isHungry(monster, config)).toBe(false)
    })

    it('should return false when life exactly 30% of maxLife', () => {
      const monster = createMonster({ life: 9, maxLife: 30 })
      expect(isHungry(monster, config)).toBe(false)
    })
  })

  describe('detectPrey', () => {
    it('should detect prey in line of sight', () => {
      const grid = createGrid(10, 10, 'empty')
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 2, y: 2 },
        predationTargets: ['nijirigoke'],
      })
      const prey: Monster = {
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 5, y: 2 },
        direction: 'right',
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

      const preyByDir = detectPrey(predator, [predator, prey], grid)

      expect(preyByDir.has('right')).toBe(true)
      expect(preyByDir.get('right')).toContainEqual(prey)
    })

    it('should not detect prey behind walls', () => {
      const grid = createGrid(10, 10, 'empty')
      grid[2][3].type = 'wall' // wall between predator and prey

      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 2, y: 2 },
        predationTargets: ['nijirigoke'],
      })
      const prey: Monster = {
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 5, y: 2 },
        direction: 'right',
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

      const preyByDir = detectPrey(predator, [predator, prey], grid)

      expect(preyByDir.has('right')).toBe(false)
    })

    it('should not detect non-prey monsters', () => {
      const grid = createGrid(10, 10, 'empty')
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 2, y: 2 },
        predationTargets: ['nijirigoke'], // only targets nijirigoke
      })
      const lizardman: Monster = {
        id: 'lizardman',
        type: 'lizardman',
        position: { x: 5, y: 2 },
        direction: 'right',
        pattern: 'stationary',
        life: 80,
        maxLife: 80,
        attack: 8,
        predationTargets: ['nijirigoke', 'gajigajimushi'],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
        phase: 'normal' as const,
        phaseTickCounter: 0,
      }

      const preyByDir = detectPrey(predator, [predator, lizardman], grid)

      expect(preyByDir.size).toBe(0)
    })
  })

  describe('prioritizePreyDirection', () => {
    it('should return default direction when not hungry', () => {
      const grid = createGrid(10, 10, 'empty')
      const predator = createMonster({
        life: 30, // not hungry
        maxLife: 30,
      })

      const result = prioritizePreyDirection(predator, [], grid, 'up', config)
      expect(result).toBe('up')
    })

    it('should return direction toward prey when hungry', () => {
      const grid = createGrid(10, 10, 'empty')
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 2, y: 2 },
        life: 5, // hungry
        maxLife: 30,
        predationTargets: ['nijirigoke'],
      })
      const prey: Monster = {
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 5, y: 2 }, // to the right
        direction: 'right',
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

      const result = prioritizePreyDirection(predator, [predator, prey], grid, 'up', config)
      expect(result).toBe('right')
    })
  })

  describe('calculateMove', () => {
    it('should override direction when hungry and prey detected', () => {
      const grid = createGrid(10, 10, 'empty')
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        pattern: 'refraction',
        position: { x: 2, y: 2 },
        direction: 'right',
        life: 5, // hungry
        maxLife: 30,
        predationTargets: ['nijirigoke'],
      })
      const prey: Monster = {
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 2, y: 5 }, // below
        direction: 'right',
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

      const result = calculateMove(predator, grid, [predator, prey], config, () => 0)

      // Should move toward prey (down)
      expect(result.direction).toBe('down')
    })

    it('should use normal pattern when not hungry', () => {
      const grid = createGrid(10, 10, 'empty')
      const monster = createMonster({
        type: 'nijirigoke',
        pattern: 'straight',
        position: { x: 2, y: 2 },
        direction: 'right',
        life: 10,
        maxLife: 10,
        predationTargets: [],
      })

      const result = calculateMove(monster, grid, [monster], config, () => 0)

      expect(result.position).toEqual({ x: 3, y: 2 })
      expect(result.direction).toBe('right')
    })
  })
})
