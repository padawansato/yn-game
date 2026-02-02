import { describe, it, expect, beforeEach } from 'vitest'
import type { Cell, GameState, Monster } from './types'
import {
  calculateAllMoves,
  resolveConflicts,
  applyMovements,
  decreaseLifeForMoved,
  tick,
  dig,
  resetMonsterIdCounter,
} from './simulation'

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

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    grid: createGrid(10, 10),
    monsters: [],
    totalInitialNutrients: 100,
    ...overrides,
  }
}

describe('Simulation', () => {
  beforeEach(() => {
    resetMonsterIdCounter()
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
            nestPosition: null,
          },
        },
        {
          monster: monster2,
          result: {
            position: { x: 2, y: 2 },
            direction: 'left' as const,
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
            nestPosition: null,
          },
        },
        {
          monster: prey,
          result: {
            position: { x: 2, y: 2 },
            direction: 'left' as const,
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
            nestPosition: null,
          },
        },
      ]

      const result = applyMovements(moves)

      expect(result.monsters[0].position).toEqual({ x: 3, y: 2 })
    })
  })

  describe('decreaseLifeForMoved', () => {
    it('should decrease life for monsters that moved', () => {
      const monster = createMonster({ id: 'm1', position: { x: 3, y: 2 }, life: 10 })
      const original = new Map([['m1', { x: 2, y: 2 }]])
      const grid = createGrid(10, 10)

      const result = decreaseLifeForMoved([monster], original, grid)

      expect(result.monsters[0].life).toBe(9)
    })

    it('should not decrease life for stationary monsters', () => {
      const monster = createMonster({ id: 'm1', position: { x: 2, y: 2 }, life: 10 })
      const original = new Map([['m1', { x: 2, y: 2 }]])
      const grid = createGrid(10, 10)

      const result = decreaseLifeForMoved([monster], original, grid)

      expect(result.monsters[0].life).toBe(10)
    })

    it('should remove monsters with 0 life', () => {
      const monster = createMonster({ id: 'm1', position: { x: 3, y: 2 }, life: 1 })
      const original = new Map([['m1', { x: 2, y: 2 }]])
      const grid = createGrid(10, 10)

      const result = decreaseLifeForMoved([monster], original, grid)

      expect(result.monsters).toHaveLength(0)
      expect(result.events).toContainEqual(
        expect.objectContaining({ type: 'MONSTER_DIED', cause: 'starvation' })
      )
    })

    it('should release nutrients to adjacent soil on death', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[2][3].type = 'empty' // monster position

      const monster = createMonster({
        id: 'm1',
        position: { x: 3, y: 2 },
        life: 1,
        carryingNutrient: 8,
      })
      const original = new Map([['m1', { x: 2, y: 2 }]])

      const result = decreaseLifeForMoved([monster], original, grid)

      expect(result.monsters).toHaveLength(0)
      // Nutrients distributed to adjacent soil cells
      let releasedTotal = 0
      releasedTotal += result.grid[1][3].nutrientAmount // up
      releasedTotal += result.grid[3][3].nutrientAmount // down
      releasedTotal += result.grid[2][2].nutrientAmount // left
      releasedTotal += result.grid[2][4].nutrientAmount // right
      expect(releasedTotal).toBe(8)
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
        pattern: 'straight',
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

    it('should process nutrient absorption for nijirigoke', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[2][2].type = 'empty' // monster starts here
      grid[2][3].type = 'empty' // monster moves here
      grid[2][4].nutrientAmount = 5 // soil with nutrients to the right

      const monster = createMonster({
        position: { x: 2, y: 2 },
        direction: 'right',
        carryingNutrient: 0,
      })
      const state = createGameState({ grid, monsters: [monster] })

      const result = tick(state)

      // Monster moved to (3,2) and absorbed nutrients from (4,2)
      expect(result.state.monsters[0].position).toEqual({ x: 3, y: 2 })
      expect(result.state.monsters[0].carryingNutrient).toBe(5)
      expect(result.state.grid[2][4].nutrientAmount).toBe(0)
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

    it('should spawn monster with life based on depleted nutrients', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 100 // 100 -> 70 available
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        // Nijirigoke maxLife is 10, so it should be capped at 10
        expect(result.state.monsters[0].life).toBeLessThanOrEqual(10)
        expect(result.state.monsters[0].carryingNutrient).toBe(0)
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
