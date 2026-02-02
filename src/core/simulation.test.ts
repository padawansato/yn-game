import { describe, it, expect, beforeEach } from 'vitest'
import type { Cell, GameState, Monster, Nutrient } from './types'
import {
  calculateAllMoves,
  resolveConflicts,
  applyMovements,
  decreaseLifeForMoved,
  tick,
  dig,
  resetMonsterIdCounter,
} from './simulation'
import { resetNutrientIdCounter } from './nutrient'

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
    carryingNutrient: null,
    nestPosition: null,
    ...overrides,
  }
}

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    grid: createGrid(10, 10),
    monsters: [],
    nutrients: [],
    totalInitialNutrients: 100,
    ...overrides,
  }
}

describe('Simulation', () => {
  beforeEach(() => {
    resetMonsterIdCounter()
    resetNutrientIdCounter()
  })

  describe('calculateAllMoves', () => {
    it('should calculate moves for all monsters', () => {
      const monster1 = createMonster({ id: 'm1', position: { x: 2, y: 2 } })
      const monster2 = createMonster({ id: 'm2', position: { x: 5, y: 5 } })
      const state = createGameState({ monsters: [monster1, monster2] })

      const moves = calculateAllMoves(state)

      expect(moves).toHaveLength(2)
    })
  })

  describe('resolveConflicts', () => {
    it('should allow single monster to move', () => {
      const monster = createMonster()
      const moves = [
        {
          monster,
          result: {
            position: { x: 3, y: 2 },
            direction: 'right' as const,
            nutrientInteraction: null,
            nutrientId: null,
            nestPosition: null,
          },
        },
      ]

      const resolved = resolveConflicts(moves)

      expect(resolved).toHaveLength(1)
      expect(resolved[0].result.position).toEqual({ x: 3, y: 2 })
    })

    it('should resolve collision by random selection when no predation', () => {
      const monster1 = createMonster({ id: 'm1', position: { x: 1, y: 2 } })
      const monster2 = createMonster({ id: 'm2', position: { x: 3, y: 2 } })
      const moves = [
        {
          monster: monster1,
          result: {
            position: { x: 2, y: 2 },
            direction: 'right' as const,
            nutrientInteraction: null,
            nutrientId: null,
            nestPosition: null,
          },
        },
        {
          monster: monster2,
          result: {
            position: { x: 2, y: 2 },
            direction: 'left' as const,
            nutrientInteraction: null,
            nutrientId: null,
            nestPosition: null,
          },
        },
      ]

      const resolved = resolveConflicts(moves, () => 0)

      expect(resolved).toHaveLength(2)
      // One should get target, other stays
      const positions = resolved.map((r) => r.result.position)
      expect(positions).toContainEqual({ x: 2, y: 2 })
    })

    it('should allow predator and prey to same position', () => {
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 1, y: 2 },
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 3, y: 2 },
      })
      const moves = [
        {
          monster: predator,
          result: {
            position: { x: 2, y: 2 },
            direction: 'right' as const,
            nutrientInteraction: null,
            nutrientId: null,
            nestPosition: null,
          },
        },
        {
          monster: prey,
          result: {
            position: { x: 2, y: 2 },
            direction: 'left' as const,
            nutrientInteraction: null,
            nutrientId: null,
            nestPosition: null,
          },
        },
      ]

      const resolved = resolveConflicts(moves)

      // Both should be allowed to move (predation will happen after)
      expect(resolved).toHaveLength(2)
      expect(resolved[0].result.position).toEqual({ x: 2, y: 2 })
      expect(resolved[1].result.position).toEqual({ x: 2, y: 2 })
    })
  })

  describe('applyMovements', () => {
    it('should update monster positions', () => {
      const monster = createMonster({ position: { x: 2, y: 2 } })
      const moves = [
        {
          monster,
          result: {
            position: { x: 3, y: 2 },
            direction: 'right' as const,
            nutrientInteraction: null,
            nutrientId: null,
            nestPosition: null,
          },
        },
      ]

      const result = applyMovements(moves, [])

      expect(result.monsters[0].position).toEqual({ x: 3, y: 2 })
    })

    it('should handle nutrient pickup', () => {
      const monster = createMonster({ type: 'nijirigoke', carryingNutrient: null })
      const nutrients: Nutrient[] = [
        { id: 'n1', position: { x: 3, y: 2 }, amount: 5, carriedBy: null },
      ]
      const moves = [
        {
          monster,
          result: {
            position: { x: 3, y: 2 },
            direction: 'right' as const,
            nutrientInteraction: 'pickup' as const,
            nutrientId: 'n1',
            nestPosition: null,
          },
        },
      ]

      const result = applyMovements(moves, nutrients)

      expect(result.monsters[0].carryingNutrient).toBe('n1')
      expect(result.nutrients[0].carriedBy).toBe('monster-1')
      expect(result.events).toContainEqual(
        expect.objectContaining({ type: 'NUTRIENT_PICKED' })
      )
    })
  })

  describe('decreaseLifeForMoved', () => {
    it('should decrease life for monsters that moved', () => {
      const monster = createMonster({ id: 'm1', position: { x: 3, y: 2 }, life: 10 })
      const original = new Map([['m1', { x: 2, y: 2 }]])

      const result = decreaseLifeForMoved([monster], original)

      expect(result.monsters[0].life).toBe(9)
    })

    it('should not decrease life for stationary monsters', () => {
      const monster = createMonster({ id: 'm1', position: { x: 2, y: 2 }, life: 10 })
      const original = new Map([['m1', { x: 2, y: 2 }]])

      const result = decreaseLifeForMoved([monster], original)

      expect(result.monsters[0].life).toBe(10)
    })

    it('should remove monsters with 0 life', () => {
      const monster = createMonster({ id: 'm1', position: { x: 3, y: 2 }, life: 1 })
      const original = new Map([['m1', { x: 2, y: 2 }]])

      const result = decreaseLifeForMoved([monster], original)

      expect(result.monsters).toHaveLength(0)
      expect(result.events).toContainEqual(
        expect.objectContaining({ type: 'MONSTER_DIED', cause: 'starvation' })
      )
    })
  })

  describe('tick', () => {
    it('should process full tick cycle', () => {
      const monster = createMonster({ position: { x: 2, y: 2 }, life: 10 })
      const state = createGameState({ monsters: [monster] })

      const result = tick(state)

      // Monster should have moved and lost 1 life
      expect(result.state.monsters[0].position).toEqual({ x: 3, y: 2 })
      expect(result.state.monsters[0].life).toBe(9)
    })

    it('should process predation when monsters move to same cell', () => {
      // Predator at (2,2) moving right to (3,2)
      // Prey at (4,2) moving left to (3,2)
      // They should collide at (3,2)
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 2, y: 2 },
        direction: 'right',
        pattern: 'straight', // use straight for predictable movement
        life: 20,
        maxLife: 30,
        attack: 3,
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({
        id: 'prey',
        type: 'nijirigoke',
        position: { x: 4, y: 2 },
        direction: 'left',
        pattern: 'straight',
        life: 5,
      })

      const state = createGameState({ monsters: [predator, prey] })

      const result = tick(state)

      // Both move to (3,2), predation should occur
      expect(result.state.monsters).toHaveLength(1)
      expect(result.state.monsters[0].type).toBe('gajigajimushi')
      expect(result.events.some((e) => e.type === 'PREDATION')).toBe(true)
    })
  })

  describe('dig', () => {
    it('should spawn Nijirigoke when digging soil', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 10
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters).toHaveLength(1)
        expect(result.state.monsters[0].type).toBe('nijirigoke')
        expect(result.state.monsters[0].position).toEqual({ x: 5, y: 5 })
        expect(result.state.grid[5][5].type).toBe('empty')
        expect(result.events[0].type).toBe('MONSTER_SPAWNED')
      }
    })

    it('should return error for non-soil', () => {
      const grid = createGrid(10, 10, 'empty')
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(true)
    })

    it('should create nutrient with depleted amount', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 100 // 100 -> 70 available
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.nutrients).toHaveLength(1)
        expect(result.state.nutrients[0].amount).toBe(70)
      }
    })

    it('should return error for out of bounds', () => {
      const grid = createGrid(10, 10, 'soil')
      const state = createGameState({ grid })

      const result = dig(state, { x: 15, y: 15 })

      expect('error' in result).toBe(true)
    })
  })
})
