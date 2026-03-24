import { describe, it, expect } from 'vitest'
import type { Cell, Monster } from './types'
import { canPredate, checkSameCellPredation, applyPredation, processPredation } from './predation'

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0, magicAmount: 0 }))
  )
}

function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'nijirigoke',
    position: { x: 0, y: 0 },
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

describe('Predation System', () => {
  describe('canPredate', () => {
    it('Gajigajimushi can eat Nijirigoke', () => {
      const predator = createMonster({
        type: 'gajigajimushi',
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({ type: 'nijirigoke' })

      expect(canPredate(predator, prey)).toBe(true)
    })

    it('Lizardman can eat Gajigajimushi', () => {
      const predator = createMonster({
        type: 'lizardman',
        predationTargets: ['nijirigoke', 'gajigajimushi'],
      })
      const prey = createMonster({ type: 'gajigajimushi' })

      expect(canPredate(predator, prey)).toBe(true)
    })

    it('Nijirigoke cannot eat anything', () => {
      const moss = createMonster({ type: 'nijirigoke', predationTargets: [] })
      const insect = createMonster({ type: 'gajigajimushi' })

      expect(canPredate(moss, insect)).toBe(false)
    })

    it('same type cannot eat each other', () => {
      const moss1 = createMonster({ type: 'nijirigoke' })
      const moss2 = createMonster({ type: 'nijirigoke' })

      expect(canPredate(moss1, moss2)).toBe(false)
    })
  })

  describe('checkSameCellPredation', () => {
    it('should detect predation at same position', () => {
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 5, y: 5 },
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
      })

      const result = checkSameCellPredation([predator, prey], { x: 5, y: 5 })

      expect(result).not.toBeNull()
      expect(result!.predator.id).toBe('predator')
      expect(result!.prey.id).toBe('prey')
    })

    it('should return null when no predation possible', () => {
      const moss1 = createMonster({
        id: 'moss1',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
      })
      const moss2 = createMonster({
        id: 'moss2',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
      })

      const result = checkSameCellPredation([moss1, moss2], { x: 5, y: 5 })

      expect(result).toBeNull()
    })

    it('should return null when only one monster at position', () => {
      const monster = createMonster({ position: { x: 5, y: 5 } })

      const result = checkSameCellPredation([monster], { x: 5, y: 5 })

      expect(result).toBeNull()
    })
  })

  describe('applyPredation', () => {
    it('should increase predator life by prey life', () => {
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        life: 20,
        maxLife: 30,
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({
        id: 'prey',
        type: 'nijirigoke',
        life: 8,
      })

      const result = applyPredation(predator, prey)

      expect(result.predator.life).toBe(28)
    })

    it('should cap life at maxLife', () => {
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        life: 28,
        maxLife: 30,
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({
        id: 'prey',
        type: 'nijirigoke',
        life: 10,
      })

      const result = applyPredation(predator, prey)

      expect(result.predator.life).toBe(30) // capped at maxLife
    })

    it('should emit PREDATION and MONSTER_DIED events', () => {
      const predator = createMonster({
        type: 'gajigajimushi',
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({ type: 'nijirigoke' })

      const result = applyPredation(predator, prey)

      expect(result.events).toHaveLength(2)
      expect(result.events[0].type).toBe('PREDATION')
      expect(result.events[1].type).toBe('MONSTER_DIED')
    })
  })

  describe('processPredation', () => {
    it('should remove dead prey from monster list', () => {
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 5, y: 5 },
        life: 20,
        maxLife: 30,
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
        life: 5,
      })
      const grid = createGrid(10, 10)

      const result = processPredation([predator, prey], grid)

      expect(result.monsters).toHaveLength(1)
      expect(result.monsters[0].id).toBe('predator')
      expect(result.monsters[0].life).toBe(25) // 20 + 5
    })

    it('should handle multiple predations at different positions', () => {
      const predator1 = createMonster({
        id: 'predator1',
        type: 'gajigajimushi',
        position: { x: 1, y: 1 },
        predationTargets: ['nijirigoke'],
      })
      const prey1 = createMonster({
        id: 'prey1',
        type: 'nijirigoke',
        position: { x: 1, y: 1 },
      })
      const predator2 = createMonster({
        id: 'predator2',
        type: 'lizardman',
        position: { x: 3, y: 3 },
        predationTargets: ['nijirigoke', 'gajigajimushi'],
      })
      const prey2 = createMonster({
        id: 'prey2',
        type: 'gajigajimushi',
        position: { x: 3, y: 3 },
      })
      const grid = createGrid(10, 10)

      const result = processPredation([predator1, prey1, predator2, prey2], grid)

      expect(result.monsters).toHaveLength(2)
      expect(result.events).toHaveLength(4) // 2 predations * 2 events each
    })

    it('should release prey nutrients to adjacent soil on death', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].type = 'empty' // predation position

      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 5, y: 5 },
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
        carryingNutrient: 8, // prey is carrying nutrients
      })

      const result = processPredation([predator, prey], grid)

      // Nutrients distributed to surrounding 9 cells (conservation law)
      let total = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          total += result.grid[5 + dy][5 + dx].nutrientAmount
        }
      }
      expect(total).toBe(8)
    })

    it('should not affect monsters at different positions', () => {
      const monster1 = createMonster({
        id: 'm1',
        type: 'gajigajimushi',
        position: { x: 1, y: 1 },
        predationTargets: ['nijirigoke'],
      })
      const monster2 = createMonster({
        id: 'm2',
        type: 'nijirigoke',
        position: { x: 5, y: 5 }, // different position
      })
      const grid = createGrid(10, 10)

      const result = processPredation([monster1, monster2], grid)

      expect(result.monsters).toHaveLength(2)
      expect(result.events).toHaveLength(0)
    })
  })
})
