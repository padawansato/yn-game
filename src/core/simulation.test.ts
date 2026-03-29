import { describe, it, expect } from 'vitest'
import type { Cell, GameEvent, GameState, Monster } from './types'
import {
  calculateAllMoves,
  resolveConflicts,
  applyMovements,
  decreaseLifeForMoved,
  processNutrientInteractions,
  processNestEstablishment,
  tick,
  dig,
  isAdjacentToEmpty,
  createGameState as createInitialGameState,
  attackMonster,
  processPhaseTransitions,
  applyMoyomoyoAttacks,
} from './simulation'
import { createDefaultConfig } from './config'
import {
  INITIAL_DIG_POWER,
  PICKAXE_DAMAGE,
  BUD_NUTRIENT_THRESHOLD,
  BUD_LIFE_THRESHOLD,
  FLOWER_NUTRIENT_THRESHOLD,
  PUPA_NUTRIENT_THRESHOLD,
  PUPA_DURATION,
  EGG_HATCH_DURATION,
  NEST_NUTRIENT_COST,
  NEST_LIFE_COST,
  MOYOMOYO_DAMAGE,
} from './constants'
import { getTotalNutrients } from './nutrient'

const config = createDefaultConfig()

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0, magicAmount: 0 }))
  )
}

function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'nijirigoke',
    position: { x: 2, y: 2 },
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

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    grid: createGrid(10, 10),
    monsters: [],
    heroes: [],
    entrancePosition: { x: 5, y: 0 },
    demonLordPosition: { x: 5, y: 9 },
    heroSpawnConfig: {
      partySize: 1,
      spawnStartTick: 100,
      spawnInterval: 10,
      heroesSpawned: 0,
    },
    totalInitialNutrients: 100,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: 0,
    nextHeroId: 0,
    isGameOver: false,
    config,
    ...overrides,
  }
}

describe('Simulation', () => {
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
            nestOrientation: null,
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
            nestOrientation: null,
          },
        },
        {
          monster: monster2,
          result: {
            position: { x: 2, y: 2 },
            direction: 'left' as const,
            nestPosition: null,
            nestOrientation: null,
          },
        },
      ]

      // randomFn returns 0, so first monster wins
      const resolved = resolveConflicts(moves, () => 0)

      expect(resolved).toHaveLength(2)
      // Winner gets target position
      const winner = resolved.find((r) => r.monster.id === 'm1')!
      expect(winner.result.position).toEqual({ x: 2, y: 2 })
      // Loser returns to original position
      const loser = resolved.find((r) => r.monster.id === 'm2')!
      expect(loser.result.position).toEqual({ x: 3, y: 2 })
    })

    it('should preserve all monsters when 3+ target same position with predation', () => {
      const predator = createMonster({
        id: 'predator',
        type: 'gajigajimushi',
        position: { x: 1, y: 2 },
        predationTargets: ['nijirigoke'],
      })
      const prey = createMonster({
        id: 'prey1',
        type: 'nijirigoke',
        position: { x: 3, y: 2 },
      })
      const bystander = createMonster({
        id: 'bystander',
        type: 'nijirigoke',
        position: { x: 2, y: 3 },
      })
      const moves = [
        {
          monster: predator,
          result: {
            position: { x: 2, y: 2 },
            direction: 'right' as const,
            nestPosition: null,
            nestOrientation: null,
          },
        },
        {
          monster: prey,
          result: {
            position: { x: 2, y: 2 },
            direction: 'left' as const,
            nestPosition: null,
            nestOrientation: null,
          },
        },
        {
          monster: bystander,
          result: {
            position: { x: 2, y: 2 },
            direction: 'up' as const,
            nestPosition: null,
            nestOrientation: null,
          },
        },
      ]

      const resolved = resolveConflicts(moves)

      // All 3 monsters must be preserved (none lost)
      expect(resolved).toHaveLength(3)
      const ids = resolved.map((r) => r.monster.id).sort()
      expect(ids).toEqual(['bystander', 'predator', 'prey1'])
      // Bystander should be sent back to original position
      const bystanderResult = resolved.find((r) => r.monster.id === 'bystander')!
      expect(bystanderResult.result.position).toEqual({ x: 2, y: 3 })
    })

    it('should preserve all monsters when 3+ target same position without predation', () => {
      const m1 = createMonster({ id: 'm1', position: { x: 1, y: 2 } })
      const m2 = createMonster({ id: 'm2', position: { x: 3, y: 2 } })
      const m3 = createMonster({ id: 'm3', position: { x: 2, y: 3 } })
      const moves = [
        {
          monster: m1,
          result: { position: { x: 2, y: 2 }, direction: 'right' as const, nestPosition: null, nestOrientation: null },
        },
        {
          monster: m2,
          result: { position: { x: 2, y: 2 }, direction: 'left' as const, nestPosition: null, nestOrientation: null },
        },
        {
          monster: m3,
          result: { position: { x: 2, y: 2 }, direction: 'up' as const, nestPosition: null, nestOrientation: null },
        },
      ]

      const resolved = resolveConflicts(moves, () => 0)

      // All 3 must be preserved
      expect(resolved).toHaveLength(3)
      const ids = resolved.map((r) => r.monster.id).sort()
      expect(ids).toEqual(['m1', 'm2', 'm3'])
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
            nestOrientation: null,
          },
        },
        {
          monster: prey,
          result: {
            position: { x: 2, y: 2 },
            direction: 'left' as const,
            nestPosition: null,
            nestOrientation: null,
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
            nestOrientation: null,
          },
        },
      ]

      const result = applyMovements(moves)

      expect(result.monsters[0].position).toEqual({ x: 3, y: 2 })
    })
  })

  describe('decreaseLifeForMoved', () => {
    it('should consume nutrient instead of life for nijirigoke with nutrients', () => {
      const monster = createMonster({
        id: 'm1',
        position: { x: 3, y: 2 },
        life: 10,
        carryingNutrient: 5,
      })
      const original = new Map([['m1', { x: 2, y: 2 }]])
      const grid = createGrid(10, 10)

      const result = decreaseLifeForMoved([monster], original, grid, config)

      expect(result.monsters[0].life).toBe(10)
      expect(result.monsters[0].carryingNutrient).toBe(4)
    })

    it('should decrease life when nijirigoke has no nutrients', () => {
      const monster = createMonster({
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 3, y: 2 },
        life: 10,
        carryingNutrient: 0,
      })
      const original = new Map([['m1', { x: 2, y: 2 }]])
      const grid = createGrid(10, 10)

      const result = decreaseLifeForMoved([monster], original, grid, config)
      expect(result.monsters[0].life).toBe(9)
      expect(result.monsters[0].carryingNutrient).toBe(0)
    })

    it('should decrease life when gajigajimushi has no nutrients', () => {
      const monster = createMonster({
        id: 'm1',
        type: 'gajigajimushi',
        position: { x: 3, y: 2 },
        life: 10,
        carryingNutrient: 0,
      })
      const original = new Map([['m1', { x: 2, y: 2 }]])
      const grid = createGrid(10, 10)

      const result = decreaseLifeForMoved([monster], original, grid, config)
      expect(result.monsters[0].life).toBe(9)
      expect(result.monsters[0].carryingNutrient).toBe(0)
    })

    it('should not decrease life for stationary monsters', () => {
      const monster = createMonster({ id: 'm1', position: { x: 2, y: 2 }, life: 10 })
      const original = new Map([['m1', { x: 2, y: 2 }]])
      const grid = createGrid(10, 10)

      const result = decreaseLifeForMoved([monster], original, grid, config)

      expect(result.monsters[0].life).toBe(10)
    })

    it('should remove monsters with 0 life', () => {
      const monster = createMonster({ id: 'm1', position: { x: 3, y: 2 }, life: 1 })
      const original = new Map([['m1', { x: 2, y: 2 }]])
      const grid = createGrid(10, 10)

      const result = decreaseLifeForMoved([monster], original, grid, config)

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
        type: 'gajigajimushi',
        position: { x: 3, y: 2 },
        life: 1,
        carryingNutrient: 8,
      })
      const original = new Map([['m1', { x: 2, y: 2 }]])

      const result = decreaseLifeForMoved([monster], original, grid, config)

      expect(result.monsters).toHaveLength(0)
      // Nutrients distributed to surrounding 9 cells (conservation law)
      let releasedTotal = 0
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          releasedTotal += result.grid[2 + dy][3 + dx].nutrientAmount
        }
      }
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

    it('should increment gameTime', () => {
      const state = createGameState({ gameTime: 0 })

      const result1 = tick(state)
      expect(result1.state.gameTime).toBe(1)

      const result2 = tick(result1.state)
      expect(result2.state.gameTime).toBe(2)
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

      // Monster moved to (3,2), absorbed 5 from (4,2), then movement cost -1
      expect(result.state.monsters[0].position).toEqual({ x: 3, y: 2 })
      expect(result.state.monsters[0].carryingNutrient).toBe(4)
      expect(result.state.grid[2][4].nutrientAmount).toBe(0)
    })
  })

  describe('tick nutrient-life ordering', () => {
    it('should absorb nutrients before decreasing life (nijirigoke survives with adjacent nutrients)', () => {
      // Nijirigoke with life=1, carry=0 on empty grid with adjacent soil nutrients
      // Old order: life decrease first → dies before absorbing
      // New order: absorb first → survives
      const grid = createGrid(10, 10, 'soil')
      grid[2][2].type = 'empty' // start
      grid[2][3].type = 'empty' // move target
      grid[2][4].nutrientAmount = 5 // soil with nutrients adjacent to (3,2)

      const monster = createMonster({
        position: { x: 2, y: 2 },
        direction: 'right',
        life: 16,
        maxLife: 16,
        carryingNutrient: 1, // only 1 nutrient, consumed by movement
      })
      const state = createGameState({ grid, monsters: [monster] })

      const result = tick(state)

      // absorb 5 → carry=6, then movement cost → carry=5
      expect(result.state.monsters).toHaveLength(1)
      expect(result.state.monsters[0].carryingNutrient).toBe(5)
      expect(result.state.monsters[0].life).toBe(16)
    })
  })

  describe('processNutrientInteractions', () => {
    it('should absorb nutrients from adjacent soil for nijirigoke', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[2][2].type = 'empty' // monster position
      grid[2][3].nutrientAmount = 5 // soil with nutrients (facing direction)

      const monster = createMonster({
        id: 'm1',
        position: { x: 2, y: 2 },
        direction: 'right',
        carryingNutrient: 0,
      })

      const result = processNutrientInteractions([monster], grid, config)

      expect(result.monsters[0].carryingNutrient).toBe(5)
      expect(result.grid[2][3].nutrientAmount).toBe(0)
      expect(result.events).toHaveLength(1)
      expect(result.events[0].type).toBe('NUTRIENT_ABSORBED')
    })

    it('should release nutrients when carrying >= threshold and no absorption', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[2][2].type = 'empty' // monster position
      // All adjacent soil has 0 nutrients, so no absorption

      const monster = createMonster({
        id: 'm1',
        position: { x: 2, y: 2 },
        direction: 'right',
        carryingNutrient: 9, // >= NUTRIENT_RELEASE_THRESHOLD(8)
      })

      const result = processNutrientInteractions([monster], grid, config)

      expect(result.monsters[0].carryingNutrient).toBe(1) // keeps 1
      expect(result.events).toHaveLength(1)
      expect(result.events[0].type).toBe('NUTRIENT_RELEASED')
    })

    it('should skip non-nijirigoke monsters', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[2][2].type = 'empty'
      grid[2][3].nutrientAmount = 5

      const monster = createMonster({
        id: 'm1',
        type: 'gajigajimushi',
        pattern: 'refraction',
        position: { x: 2, y: 2 },
        carryingNutrient: 0,
      })

      const result = processNutrientInteractions([monster], grid, config)

      expect(result.monsters[0].carryingNutrient).toBe(0)
      expect(result.grid[2][3].nutrientAmount).toBe(5)
      expect(result.events).toHaveLength(0)
    })

    it('should prioritize absorption over release', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[2][2].type = 'empty'
      grid[2][3].nutrientAmount = 3 // facing direction has nutrients

      const monster = createMonster({
        id: 'm1',
        position: { x: 2, y: 2 },
        direction: 'right',
        carryingNutrient: 5, // above release threshold
      })

      const result = processNutrientInteractions([monster], grid, config)

      // Should absorb (not release), since absorption happens first
      expect(result.monsters[0].carryingNutrient).toBe(8) // 5 + 3
      expect(result.grid[2][3].nutrientAmount).toBe(0)
      expect(result.events[0].type).toBe('NUTRIENT_ABSORBED')
    })
  })

  describe('isAdjacentToEmpty', () => {
    it('should return true if adjacent to empty cell', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][4].type = 'empty' // empty to the left of (5,5)

      expect(isAdjacentToEmpty({ x: 5, y: 5 }, grid)).toBe(true)
    })

    it('should return false if not adjacent to empty cell', () => {
      const grid = createGrid(10, 10, 'soil')

      expect(isAdjacentToEmpty({ x: 5, y: 5 }, grid)).toBe(false)
    })

    it('should check all four directions', () => {
      const grid = createGrid(10, 10, 'soil')

      // Test each direction
      grid[4][5].type = 'empty' // up
      expect(isAdjacentToEmpty({ x: 5, y: 5 }, grid)).toBe(true)

      grid[4][5].type = 'soil'
      grid[6][5].type = 'empty' // down
      expect(isAdjacentToEmpty({ x: 5, y: 5 }, grid)).toBe(true)

      grid[6][5].type = 'soil'
      grid[5][6].type = 'empty' // right
      expect(isAdjacentToEmpty({ x: 5, y: 5 }, grid)).toBe(true)
    })
  })

  describe('dig', () => {
    it('should spawn Nijirigoke when digging soil with nutrients adjacent to empty', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 5 // 1-9 spawns nijirigoke
      grid[5][4].type = 'empty' // adjacent empty cell
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

    it('should not spawn Nijirigoke when digging soil with zero nutrients', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 0
      grid[5][4].type = 'empty' // adjacent empty cell
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters).toHaveLength(0)
        expect(result.state.grid[5][5].type).toBe('empty')
        expect(result.events).toHaveLength(0)
      }
    })

    it('should return error for non-soil', () => {
      const grid = createGrid(10, 10, 'empty')
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(true)
    })

    it('should return error when not adjacent to empty', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 10
      // No adjacent empty cell
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Can only dig blocks adjacent to empty space')
      }
    })

    it('should spawn monster with nutrient-based life and carry remaining nutrients', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 9 // nijirigoke: life=min(9,16)=9, remaining=0
      grid[5][4].type = 'empty' // adjacent empty cell
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        // life = min(nutrients, maxLife) = min(9, 16) = 9
        expect(result.state.monsters[0].life).toBe(9)
        expect(result.state.monsters[0].carryingNutrient).toBe(0)
      }
    })

    it('should return error for out of bounds', () => {
      const grid = createGrid(10, 10, 'soil')
      const state = createGameState({ grid })

      const result = dig(state, { x: 15, y: 15 })

      expect('error' in result).toBe(true)
    })

    // 境界値テスト: 養分によるモンスター生成
    it('should spawn nijirigoke when nutrient is 9 (upper boundary)', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 9
      grid[5][4].type = 'empty'
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters).toHaveLength(1)
        expect(result.state.monsters[0].type).toBe('nijirigoke')
      }
    })

    it('should spawn gajigajimushi when nutrient is 10 (lower boundary)', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 10
      grid[5][4].type = 'empty'
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters).toHaveLength(1)
        expect(result.state.monsters[0].type).toBe('gajigajimushi')
      }
    })

    it('should spawn gajigajimushi when nutrient is 16 (upper boundary)', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 16
      grid[5][4].type = 'empty'
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters).toHaveLength(1)
        expect(result.state.monsters[0].type).toBe('gajigajimushi')
      }
    })

    it('should spawn lizardman when nutrient is 17 (lower boundary)', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 17
      grid[5][4].type = 'empty'
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters).toHaveLength(1)
        expect(result.state.monsters[0].type).toBe('lizardman')
      }
    })

    it('should spawn nijirigoke with nutrient-based life', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 5 // nijirigoke: life=min(5,16)=5, remaining=0
      grid[5][4].type = 'empty'
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters[0].life).toBe(5) // min(nutrients, maxLife)
        expect(result.state.monsters[0].carryingNutrient).toBe(0)
      }
    })

    it('should spawn gajigajimushi with nutrient-based life', () => {
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].nutrientAmount = 10 // spawns gajigajimushi: life=min(10,30)=10, remaining=0
      grid[5][4].type = 'empty'
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        // life = min(nutrients, maxLife) = min(10, 30) = 10
        expect(result.state.monsters[0].life).toBe(10)
        expect(result.state.monsters[0].carryingNutrient).toBe(0)
      }
    })

    it('should cap carryingNutrient at NUTRIENT_CARRY_CAPACITY and distribute surplus', () => {
      const grid = createGrid(10, 10, 'soil')
      // lizardman (nutrient >= 17): life=min(25,120)=25, remaining=0, carried=0
      // Use nutrient=140 to test carry cap: life=min(140,120)=120, remaining=20, carried=min(20,10)=10, surplus=10
      grid[5][5].nutrientAmount = 140
      grid[5][4].type = 'empty'
      const state = createGameState({ grid })

      const result = dig(state, { x: 5, y: 5 })

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters[0].type).toBe('lizardman')
        expect(result.state.monsters[0].life).toBe(120) // min(140, 120) = 120
        expect(result.state.monsters[0].carryingNutrient).toBe(10) // min(140-120, 10) = 10
        // surplus 10 distributed to surrounding cells
      }
    })

    // Dig Power tests
    describe('dig power', () => {
      it('should consume 1 dig power on successful dig', () => {
        const grid = createGrid(10, 10, 'soil')
        grid[5][5].nutrientAmount = 5
        grid[5][4].type = 'empty'
        const state = createGameState({ grid, digPower: 10 })

        const result = dig(state, { x: 5, y: 5 })

        expect('error' in result).toBe(false)
        if (!('error' in result)) {
          expect(result.state.digPower).toBe(9)
        }
      })

      it('should fail with "insufficient dig power" when digPower is 0', () => {
        const grid = createGrid(10, 10, 'soil')
        grid[5][5].nutrientAmount = 5
        grid[5][4].type = 'empty'
        const state = createGameState({ grid, digPower: 0 })

        const result = dig(state, { x: 5, y: 5 })

        expect('error' in result).toBe(true)
        if ('error' in result) {
          expect(result.error).toBe('insufficient dig power')
        }
      })

      it('should not consume dig power on failed dig (invalid position)', () => {
        const grid = createGrid(10, 10, 'soil')
        const state = createGameState({ grid, digPower: 10 })

        const result = dig(state, { x: 15, y: 15 })

        expect('error' in result).toBe(true)
        // digPower should remain unchanged (state not mutated, but verify behavior)
      })

      it('should not consume dig power on failed dig (not adjacent to empty)', () => {
        const grid = createGrid(10, 10, 'soil')
        grid[5][5].nutrientAmount = 10
        const state = createGameState({ grid, digPower: 10 })

        const result = dig(state, { x: 5, y: 5 })

        expect('error' in result).toBe(true)
        // digPower should remain unchanged
      })

      it('should succeed with positive dig power', () => {
        const grid = createGrid(10, 10, 'soil')
        grid[5][5].nutrientAmount = 5
        grid[5][4].type = 'empty'
        const state = createGameState({ grid, digPower: 1 })

        const result = dig(state, { x: 5, y: 5 })

        expect('error' in result).toBe(false)
        if (!('error' in result)) {
          expect(result.state.digPower).toBe(0)
        }
      })
    })
  })

  describe('createGameState', () => {
    it('should initialize digPower to INITIAL_DIG_POWER', () => {
      const state = createInitialGameState(10, 10)

      expect(state.digPower).toBe(INITIAL_DIG_POWER)
    })

    it('should initialize hero-related fields', () => {
      const state = createInitialGameState(20, 15)

      expect(state.heroes).toEqual([])
      expect(state.nextHeroId).toBe(0)
      expect(state.isGameOver).toBe(false)
      expect(state.entrancePosition).toEqual({ x: 10, y: 0 })
      expect(state.demonLordPosition).toBeNull()
    })

    it('should initialize heroSpawnConfig with defaults', () => {
      const state = createInitialGameState(20, 15)

      expect(state.heroSpawnConfig.partySize).toBe(1)
      expect(state.heroSpawnConfig.spawnStartTick).toBe(100)
      expect(state.heroSpawnConfig.spawnInterval).toBe(10)
      expect(state.heroSpawnConfig.heroesSpawned).toBe(0)
    })

    it('should ensure entrance cell is wall (monsters cannot enter)', () => {
      const state = createInitialGameState(20, 15)

      const entranceCell = state.grid[state.entrancePosition.y][state.entrancePosition.x]
      expect(entranceCell.type).toBe('wall')
    })

    it('should not place demon lord by default', () => {
      const state = createInitialGameState(20, 15)

      expect(state.demonLordPosition).toBeNull()
    })

    it('should accept custom demonLordPosition', () => {
      const state = createInitialGameState(20, 15, 0.7, { demonLordPosition: { x: 5, y: 5 } })

      expect(state.demonLordPosition).toEqual({ x: 5, y: 5 })
      expect(state.grid[5][5].type).toBe('empty')
    })
  })

  describe('attackMonster', () => {
    it('should deal damage to monster', () => {
      const grid = createGrid(5, 5, 'empty')
      const monster = createMonster({ id: 'm1', life: 10, maxLife: 16 })
      const state = createGameState({ grid, monsters: [monster] })

      const result = attackMonster(state, 'm1', PICKAXE_DAMAGE)

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.monsters[0].life).toBe(10 - PICKAXE_DAMAGE)
        expect(result.events).toContainEqual(
          expect.objectContaining({
            type: 'MONSTER_ATTACKED',
            monsterId: 'm1',
            damage: PICKAXE_DAMAGE,
          })
        )
      }
    })

    it('should kill monster and release nutrients on death', () => {
      const grid = createGrid(5, 5, 'soil')
      grid[2][2].type = 'empty' // monster position
      const monster = createMonster({
        id: 'm1',
        position: { x: 2, y: 2 },
        life: 3,
        maxLife: 16,
        carryingNutrient: 8,
      })
      const state = createGameState({ grid, monsters: [monster] })

      const result = attackMonster(state, 'm1', PICKAXE_DAMAGE)

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        // Monster should be dead
        expect(result.state.monsters).toHaveLength(0)

        // Conservation: 8 nutrients should be distributed to surrounding cells
        let totalNutrients = 0
        for (const row of result.state.grid) {
          for (const cell of row) {
            totalNutrients += cell.nutrientAmount
          }
        }
        expect(totalNutrients).toBe(8)

        // Should have MONSTER_ATTACKED and MONSTER_DIED events
        expect(result.events.some((e) => e.type === 'MONSTER_ATTACKED')).toBe(true)
        expect(result.events.some((e) => e.type === 'MONSTER_DIED' && e.cause === 'pickaxe')).toBe(
          true
        )
      }
    })

    it('should return error for non-existent monster', () => {
      const grid = createGrid(5, 5, 'empty')
      const state = createGameState({ grid })

      const result = attackMonster(state, 'nonexistent', PICKAXE_DAMAGE)

      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Monster not found')
      }
    })

    it('should not consume digPower', () => {
      const grid = createGrid(5, 5, 'empty')
      const monster = createMonster({ id: 'm1', life: 10 })
      const state = createGameState({ grid, monsters: [monster], digPower: 50 })

      const result = attackMonster(state, 'm1', PICKAXE_DAMAGE)

      expect('error' in result).toBe(false)
      if (!('error' in result)) {
        expect(result.state.digPower).toBe(50) // unchanged
      }
    })
  })

  describe('processPhaseTransitions', () => {
    describe('Nijirigoke lifecycle', () => {
      it('should transition mobile → bud when conditions met', () => {
        const grid = createGrid(5, 5, 'empty')
        const monster = createMonster({
          id: 'm1',
          type: 'nijirigoke',
          phase: 'mobile',
          carryingNutrient: BUD_NUTRIENT_THRESHOLD,
          life: BUD_LIFE_THRESHOLD,
          maxLife: 24,
          phaseTickCounter: 8, // >= minMobileTicks
        })
        const state = createGameState({ grid, monsters: [monster] })

        const result = processPhaseTransitions(state)

        expect(result.monsters[0].phase).toBe('bud')
        expect(result.events.some((e) => e.type === 'PHASE_TRANSITION')).toBe(true)
      })

      it('should NOT transition mobile → bud before minMobileTicks', () => {
        const grid = createGrid(5, 5, 'empty')
        const monster = createMonster({
          id: 'm1',
          type: 'nijirigoke',
          phase: 'mobile',
          carryingNutrient: BUD_NUTRIENT_THRESHOLD,
          phaseTickCounter: 0, // below minMobileTicks (default: 8)
        })
        const state = createGameState({ grid, monsters: [monster] })

        const result = processPhaseTransitions(state)

        expect(result.monsters[0].phase).toBe('mobile')
        expect(result.monsters[0].phaseTickCounter).toBe(1) // incremented
      })

      it('should transition bud → flower when nutrients sufficient', () => {
        const grid = createGrid(5, 5, 'empty')
        const monster = createMonster({
          id: 'm1',
          type: 'nijirigoke',
          phase: 'bud',
          carryingNutrient: FLOWER_NUTRIENT_THRESHOLD,
          life: 5,
        })
        const state = createGameState({ grid, monsters: [monster] })

        const result = processPhaseTransitions(state)

        expect(result.monsters[0].phase).toBe('flower')
      })

      it('should drain life in flower phase and transition to withered', () => {
        const grid = createGrid(5, 5, 'empty')
        const monster = createMonster({
          id: 'm1',
          type: 'nijirigoke',
          phase: 'flower',
          life: 1, // will reach 0 with 1/tick drain
          carryingNutrient: 3,
        })
        const state = createGameState({ grid, monsters: [monster] })

        const result = processPhaseTransitions(state)

        expect(result.monsters[0].phase).toBe('withered')
        expect(result.monsters[0].life).toBe(0)
      })

      it('should reproduce in withered phase and distribute nutrients', () => {
        const grid = createGrid(5, 5, 'empty')
        const monster = createMonster({
          id: 'm1',
          type: 'nijirigoke',
          position: { x: 2, y: 2 },
          phase: 'withered',
          life: 0,
          carryingNutrient: 10,
        })
        const state = createGameState({ grid, monsters: [monster] })

        const result = processPhaseTransitions(state)

        // Parent should be dead (filtered out)
        const parents = result.monsters.filter((m) => m.id === 'm1')
        expect(parents).toHaveLength(0)

        // Offspring should exist
        const offspring = result.monsters.filter((m) => m.id !== 'm1')
        expect(offspring.length).toBeGreaterThan(0)
        expect(offspring.length).toBeLessThanOrEqual(5)

        // Conservation: total offspring nutrients = parent's nutrients
        const totalNutrients = offspring.reduce((sum, m) => sum + m.carryingNutrient, 0)
        expect(totalNutrients).toBe(10)
      })
    })

    describe('Gajigajimushi lifecycle', () => {
      it('should transition larva → pupa', () => {
        const grid = createGrid(5, 5, 'empty')
        const monster = createMonster({
          id: 'm1',
          type: 'gajigajimushi',
          phase: 'larva',
          pattern: 'refraction',
          carryingNutrient: PUPA_NUTRIENT_THRESHOLD,
        })
        const state = createGameState({ grid, monsters: [monster] })

        const result = processPhaseTransitions(state)

        expect(result.monsters[0].phase).toBe('pupa')
      })

      it('should transition pupa → adult after duration', () => {
        const grid = createGrid(5, 5, 'empty')
        const monster = createMonster({
          id: 'm1',
          type: 'gajigajimushi',
          phase: 'pupa',
          pattern: 'refraction',
          phaseTickCounter: PUPA_DURATION - 1,
        })
        const state = createGameState({ grid, monsters: [monster] })

        const result = processPhaseTransitions(state)

        expect(result.monsters[0].phase).toBe('adult')
      })
    })

    describe('Lizardman lifecycle', () => {
      it('should transition to egg phase and then hatch', () => {
        const grid = createGrid(5, 5, 'empty')
        const egg = createMonster({
          id: 'egg1',
          type: 'lizardman',
          phase: 'egg',
          pattern: 'stationary',
          phaseTickCounter: EGG_HATCH_DURATION - 1,
          life: 1,
          maxLife: 1,
          carryingNutrient: 5,
        })
        const state = createGameState({ grid, monsters: [egg] })

        const result = processPhaseTransitions(state)

        expect(result.monsters[0].phase).toBe('normal')
        expect(result.monsters[0].life).toBe(120) // lizardman config life
        expect(result.monsters[0].carryingNutrient).toBe(5) // preserved
        expect(result.events.some((e) => e.type === 'EGG_HATCHED')).toBe(true)
      })
    })

    describe('Immobile phase movement', () => {
      it('should not move monsters in immobile phases', () => {
        const grid = createGrid(5, 5, 'empty')
        const monster = createMonster({
          id: 'm1',
          type: 'nijirigoke',
          position: { x: 2, y: 2 },
          phase: 'bud',
          direction: 'right',
        })
        const state = createGameState({ grid, monsters: [monster] })

        const result = tick(state)

        // Bud should not move
        expect(result.state.monsters[0].position).toEqual({ x: 2, y: 2 })
      })
    })
  })

  describe('Bug fixes (review findings)', () => {
    describe('Conservation violation: nijirigoke movement cost', () => {
      it('should deposit 1 nutrient to origin cell when nijirigoke moves (not lose it)', () => {
        const grid = createGrid(10, 10)
        // Place nijirigoke at (2,2) with carryingNutrient=5, moving right to (3,2)
        const monster = createMonster({
          id: 'niji-1',
          position: { x: 2, y: 2 },
          direction: 'right',
          carryingNutrient: 5,
          life: 10,
        })
        const state = createGameState({ grid, monsters: [monster] })

        const before = getTotalNutrients(state)
        const result = tick(state)
        const after = getTotalNutrients(result.state)

        // Conservation law: total nutrients must not change
        expect(after).toBe(before)
      })
    })

    describe('ID duplication: multiple reproductions in same tick', () => {
      it('should assign unique IDs when multiple nijirigoke reproduce in same tick', () => {
        const grid = createGrid(10, 10)
        // Two withered nijirigoke ready to reproduce
        const m1 = createMonster({
          id: 'niji-1',
          position: { x: 2, y: 2 },
          phase: 'withered',
          phaseTickCounter: 0,
          carryingNutrient: 3,
          life: 0,
        })
        const m2 = createMonster({
          id: 'niji-2',
          position: { x: 6, y: 6 },
          phase: 'withered',
          phaseTickCounter: 0,
          carryingNutrient: 3,
          life: 0,
        })
        const state = createGameState({ grid, monsters: [m1, m2], nextMonsterId: 10 })

        const result = processPhaseTransitions(state)
        const allIds = result.monsters.map((m) => m.id)
        const uniqueIds = new Set(allIds)

        // All monster IDs must be unique
        expect(uniqueIds.size).toBe(allIds.length)
      })
    })

    describe('Withered nijirigoke: no empty cells available', () => {
      it('should die and release nutrients when no empty cells for reproduction', () => {
        // Grid entirely of soil (no empty cells around)
        const grid = createGrid(10, 10, 'soil')
        const monster = createMonster({
          id: 'niji-1',
          position: { x: 5, y: 5 },
          phase: 'withered',
          phaseTickCounter: 0,
          carryingNutrient: 8,
          life: 0,
        })
        const state = createGameState({ grid, monsters: [monster] })

        const before = getTotalNutrients(state)
        const result = processPhaseTransitions(state)

        // Monster should die (removed from list)
        const surviving = result.monsters.filter((m) => m.id === 'niji-1')
        expect(surviving.length).toBe(0)

        // Nutrients should be released to grid (conservation)
        const afterState = createGameState({ grid: result.grid, monsters: result.monsters })
        const after = getTotalNutrients(afterState)
        expect(after).toBe(before)
      })
    })

    describe('Dig: monsters receive nutrient-based life and carry excess', () => {
      it('should give gajigajimushi nutrient-based life with excess as carryingNutrient', () => {
        const grid = createGrid(10, 10, 'soil')
        // gajigajimushi range: 10 <= nutrient < 17
        // nutrient=16: life=min(16,30)=16, remaining=0, carried=0
        grid[5][5].nutrientAmount = 16
        grid[5][4].type = 'empty'
        const state = createGameState({ grid })

        const result = dig(state, { x: 5, y: 5 })

        expect('error' in result).toBe(false)
        if (!('error' in result)) {
          expect(result.state.monsters[0].type).toBe('gajigajimushi')
          expect(result.state.monsters[0].life).toBe(16)
          expect(result.state.monsters[0].carryingNutrient).toBe(0)
        }
      })

      it('should give lizardman nutrient-based life with excess as carryingNutrient', () => {
        const grid = createGrid(10, 10, 'soil')
        grid[5][5].nutrientAmount = 140 // spawns lizardman: life=min(140,120)=120, remaining=20, carried=10
        grid[5][4].type = 'empty'
        const state = createGameState({ grid })

        const result = dig(state, { x: 5, y: 5 })

        expect('error' in result).toBe(false)
        if (!('error' in result)) {
          expect(result.state.monsters[0].life).toBe(120)
          expect(result.state.monsters[0].carryingNutrient).toBe(10)
        }
      })
    })
  })

  describe('processNestEstablishment', () => {
    it('should deduct nutrient and life cost when nest is newly established (null → non-null)', () => {
      const monster = createMonster({
        id: 'liz-1',
        type: 'lizardman',
        life: 60,
        maxLife: 120,
        carryingNutrient: 20,
        nestPosition: { x: 3, y: 3 },
        nestOrientation: 'horizontal',
      })

      const originalNestPositions = new Map<string, { x: number; y: number } | null>()
      originalNestPositions.set('liz-1', null)

      const result = processNestEstablishment([monster], originalNestPositions, config)

      expect(result.monsters[0].carryingNutrient).toBe(20 - NEST_NUTRIENT_COST)
      expect(result.monsters[0].life).toBe(60 - NEST_LIFE_COST)
    })

    it('should not deduct cost when nest was already established (non-null → non-null)', () => {
      const monster = createMonster({
        id: 'liz-2',
        type: 'lizardman',
        life: 60,
        maxLife: 120,
        carryingNutrient: 20,
        nestPosition: { x: 3, y: 3 },
        nestOrientation: 'horizontal',
      })

      const originalNestPositions = new Map<string, { x: number; y: number } | null>()
      originalNestPositions.set('liz-2', { x: 3, y: 3 })

      const result = processNestEstablishment([monster], originalNestPositions, config)

      expect(result.monsters[0].carryingNutrient).toBe(20)
      expect(result.monsters[0].life).toBe(60)
    })

    it('should not deduct cost for monsters without nest (null → null)', () => {
      const monster = createMonster({
        id: 'liz-3',
        type: 'lizardman',
        life: 60,
        maxLife: 120,
        carryingNutrient: 20,
        nestPosition: null,
      })

      const originalNestPositions = new Map<string, { x: number; y: number } | null>()
      originalNestPositions.set('liz-3', null)

      const result = processNestEstablishment([monster], originalNestPositions, config)

      expect(result.monsters[0].carryingNutrient).toBe(20)
      expect(result.monsters[0].life).toBe(60)
    })
  })

  describe('applyMoyomoyoAttacks', () => {
    it('should deal damage to adjacent gajigajimushi', () => {
      const grid = createGrid(5, 5)
      const flower = createMonster({
        id: 'flower-1',
        type: 'nijirigoke',
        phase: 'flower',
        position: { x: 2, y: 2 },
        life: 5,
        carryingNutrient: 10,
      })
      const gaji = createMonster({
        id: 'gaji-1',
        type: 'gajigajimushi',
        phase: 'larva',
        position: { x: 3, y: 2 },
        life: 30,
        maxLife: 30,
        attack: 3,
        predationTargets: ['nijirigoke'],
      })

      const events: GameEvent[] = []
      const result = applyMoyomoyoAttacks([flower, gaji], grid, events, config)

      const updatedGaji = result.monsters.find((m) => m.id === 'gaji-1')
      expect(updatedGaji).toBeDefined()
      expect(updatedGaji!.life).toBe(30 - MOYOMOYO_DAMAGE)

      const attackEvents = events.filter((e) => e.type === 'MOYOMOYO_ATTACK')
      expect(attackEvents).toHaveLength(1)
      expect(attackEvents[0]).toMatchObject({
        type: 'MOYOMOYO_ATTACK',
        attackerId: 'flower-1',
        targetId: 'gaji-1',
        damage: MOYOMOYO_DAMAGE,
      })
    })

    it('should kill gajigajimushi when life reaches 0 and release nutrients', () => {
      const grid = createGrid(5, 5)
      const flower = createMonster({
        id: 'flower-1',
        type: 'nijirigoke',
        phase: 'flower',
        position: { x: 2, y: 2 },
        life: 5,
        carryingNutrient: 10,
      })
      const gaji = createMonster({
        id: 'gaji-1',
        type: 'gajigajimushi',
        phase: 'larva',
        position: { x: 3, y: 2 },
        life: 1, // Will die from MOYOMOYO_DAMAGE (2)
        maxLife: 30,
        attack: 3,
        predationTargets: ['nijirigoke'],
        carryingNutrient: 4,
      })

      const events: GameEvent[] = []
      const result = applyMoyomoyoAttacks([flower, gaji], grid, events, config)

      // Gaji should be removed
      const updatedGaji = result.monsters.find((m) => m.id === 'gaji-1')
      expect(updatedGaji).toBeUndefined()

      // Should have MONSTER_DIED event
      const deathEvents = events.filter((e) => e.type === 'MONSTER_DIED')
      expect(deathEvents).toHaveLength(1)

      // Nutrients should be released to grid (conservation law)
      const totalGridNutrients = result.grid.flat().reduce((sum, c) => sum + c.nutrientAmount, 0)
      expect(totalGridNutrients).toBe(4) // gaji's carryingNutrient released
    })

    it('should NOT affect gajigajimushi outside 9-cell range', () => {
      const grid = createGrid(7, 7)
      const flower = createMonster({
        id: 'flower-1',
        type: 'nijirigoke',
        phase: 'flower',
        position: { x: 2, y: 2 },
        life: 5,
        carryingNutrient: 10,
      })
      // Position (5, 2) is 3 cells away - outside 9-cell range
      const farGaji = createMonster({
        id: 'gaji-far',
        type: 'gajigajimushi',
        phase: 'larva',
        position: { x: 5, y: 2 },
        life: 30,
        maxLife: 30,
        attack: 3,
        predationTargets: ['nijirigoke'],
      })

      const events: GameEvent[] = []
      const result = applyMoyomoyoAttacks([flower, farGaji], grid, events, config)

      const updatedGaji = result.monsters.find((m) => m.id === 'gaji-far')
      expect(updatedGaji).toBeDefined()
      expect(updatedGaji!.life).toBe(30) // No damage

      const attackEvents = events.filter((e) => e.type === 'MOYOMOYO_ATTACK')
      expect(attackEvents).toHaveLength(0)
    })

    it('should NOT affect non-gajigajimushi monsters', () => {
      const grid = createGrid(5, 5)
      const flower = createMonster({
        id: 'flower-1',
        type: 'nijirigoke',
        phase: 'flower',
        position: { x: 2, y: 2 },
        life: 5,
        carryingNutrient: 10,
      })
      const lizard = createMonster({
        id: 'liz-1',
        type: 'lizardman',
        phase: 'normal',
        position: { x: 3, y: 2 },
        life: 120,
        maxLife: 120,
        attack: 15,
        predationTargets: ['nijirigoke', 'gajigajimushi'],
      })
      // Another nijirigoke should also not be targeted
      const otherKoke = createMonster({
        id: 'koke-2',
        type: 'nijirigoke',
        phase: 'mobile',
        position: { x: 1, y: 2 },
        life: 10,
      })

      const events: GameEvent[] = []
      const result = applyMoyomoyoAttacks([flower, lizard, otherKoke], grid, events, config)

      expect(result.monsters.find((m) => m.id === 'liz-1')!.life).toBe(120)
      expect(result.monsters.find((m) => m.id === 'koke-2')!.life).toBe(10)

      const attackEvents = events.filter((e) => e.type === 'MOYOMOYO_ATTACK')
      expect(attackEvents).toHaveLength(0)
    })
  })

  describe('Hero integration in tick()', () => {
    it('should spawn hero when spawnStartTick is reached', () => {
      const state = createGameState({
        gameTime: 100,
        heroSpawnConfig: {
          partySize: 1,
          spawnStartTick: 100,
          spawnInterval: 10,
          heroesSpawned: 0,
        },
      })

      const result = tick(state, () => 0)

      expect(result.state.heroes).toHaveLength(1)
      // Hero spawns and then moves in the same tick, so check spawn event instead of position
      expect(result.events.some((e) => e.type === 'HERO_SPAWNED')).toBe(true)
      expect(result.state.heroSpawnConfig.heroesSpawned).toBe(1)
    })

    it('should move heroes via AI each tick', () => {
      // Create a grid with a path down from entrance
      const grid = createGrid(5, 5)
      // Make entrance and path empty
      grid[0][2] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
      grid[1][2] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }

      const hero: import('./hero/types').HeroEntity = {
        kind: 'hero',
        id: 'hero-1',
        position: { x: 2, y: 0 },
        direction: 'down',
        life: 50,
        maxLife: 50,
        attack: 5,
        attackPattern: 'slash',
        visitedCells: new Set(['2,0']),
        pathHistory: [{ x: 2, y: 0 }],
        state: 'exploring',
        targetFound: false,
      }

      const state = createGameState({
        grid,
        heroes: [hero],
        entrancePosition: { x: 2, y: 0 },
        demonLordPosition: { x: 2, y: 4 },
        heroSpawnConfig: {
          partySize: 1,
          spawnStartTick: 100,
          spawnInterval: 10,
          heroesSpawned: 1,
        },
      })

      const result = tick(state)

      // Hero should have moved from (2,0)
      expect(result.state.heroes[0].position).not.toEqual({ x: 2, y: 0 })
    })

    it('should process combat between hero and monster in tick', () => {
      // Hero at (2,2) facing right, bud nijirigoke at (3,2) (immobile)
      // Hero can't move (all neighbors are walls or visited)
      // Hero's front = (3,2) = monster → combat
      const grid = createGrid(5, 5, 'wall')
      grid[2][2] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
      grid[2][3] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }

      const hero: import('./hero/types').HeroEntity = {
        kind: 'hero',
        id: 'hero-1',
        position: { x: 2, y: 2 },
        direction: 'right',
        life: 50,
        maxLife: 50,
        attack: 5,
        attackPattern: 'slash',
        visitedCells: new Set(['2,2', '3,2']),
        pathHistory: [{ x: 2, y: 2 }],
        state: 'exploring',
        targetFound: false,
      }

      // Bud nijirigoke is immobile - won't move during monster phase
      const monster = createMonster({
        id: 'monster-1',
        position: { x: 3, y: 2 },
        type: 'nijirigoke',
        phase: 'bud',
        life: 5,
        attack: 0,
        direction: 'left',
      })

      const state = createGameState({
        grid,
        heroes: [hero],
        monsters: [monster],
        entrancePosition: { x: 2, y: 0 },
        demonLordPosition: { x: 4, y: 4 },
        heroSpawnConfig: {
          partySize: 1,
          spawnStartTick: 200,
          spawnInterval: 10,
          heroesSpawned: 1,
        },
      })

      const result = tick(state)

      const combatEvents = result.events.filter((e) => e.type === 'HERO_COMBAT')
      expect(combatEvents.length).toBeGreaterThan(0)
    })

    it('should set isGameOver when hero escapes (returns to entrance)', () => {
      const grid = createGrid(5, 5)
      grid[0][2] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }

      // Hero is returning, one step away from entrance
      const hero: import('./hero/types').HeroEntity = {
        kind: 'hero',
        id: 'hero-1',
        position: { x: 2, y: 1 },
        direction: 'up',
        life: 50,
        maxLife: 50,
        attack: 5,
        attackPattern: 'slash',
        visitedCells: new Set(['2,0', '2,1']),
        pathHistory: [{ x: 2, y: 0 }, { x: 2, y: 1 }],
        state: 'returning',
        targetFound: true,
      }

      const state = createGameState({
        grid,
        heroes: [hero],
        entrancePosition: { x: 2, y: 0 },
        demonLordPosition: { x: 2, y: 4 },
        heroSpawnConfig: {
          partySize: 1,
          spawnStartTick: 200,
          spawnInterval: 10,
          heroesSpawned: 1,
        },
      })

      const result = tick(state)

      expect(result.state.isGameOver).toBe(true)
      expect(result.events.some((e) => e.type === 'HERO_ESCAPED')).toBe(true)
      expect(result.events.some((e) => e.type === 'GAME_OVER')).toBe(true)
    })

    it('should not process tick when isGameOver is true', () => {
      const state = createGameState({
        isGameOver: true,
        gameTime: 50,
      })

      const result = tick(state)

      // gameTime should not advance
      expect(result.state.gameTime).toBe(50)
      expect(result.events).toHaveLength(0)
    })

    it('should run E2E scenario: spawn → explore → find demon lord → return → GAME_OVER', () => {
      // Small 5x3 grid: entrance at (2,0), demon lord at (2,2)
      // Layout: all empty except walls
      const grid: Cell[][] = [
        // y=0: wall, wall, empty(entrance), wall, wall
        [
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'empty', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
        ],
        // y=1: wall, wall, empty, wall, wall
        [
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'empty', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
        ],
        // y=2: wall, wall, empty(demon lord), wall, wall
        [
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'empty', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
          { type: 'wall', nutrientAmount: 0, magicAmount: 0 },
        ],
      ]

      const state = createGameState({
        grid,
        entrancePosition: { x: 2, y: 0 },
        demonLordPosition: { x: 2, y: 2 },
        heroSpawnConfig: {
          partySize: 1,
          spawnStartTick: 0, // spawn immediately
          spawnInterval: 10,
          heroesSpawned: 0,
        },
        gameTime: 0,
      })

      // Tick 0: hero spawns at entrance (2,0) and moves to (2,1) in the same tick
      let current = tick(state, () => 0)
      expect(current.state.heroes).toHaveLength(1)
      expect(current.events.some((e) => e.type === 'HERO_SPAWNED')).toBe(true)
      expect(current.state.heroes[0].position).toEqual({ x: 2, y: 1 })

      // Tick 1: hero moves to (2,2) - demon lord found, state becomes returning
      current = tick(current.state, () => 0)
      expect(current.state.heroes[0].position).toEqual({ x: 2, y: 2 })
      expect(current.state.heroes[0].state).toBe('returning')
      expect(current.events.some((e) => e.type === 'DEMON_LORD_FOUND')).toBe(true)

      // Tick 2: hero returns to (2,1)
      current = tick(current.state, () => 0)
      expect(current.state.heroes[0].position).toEqual({ x: 2, y: 1 })

      // Tick 3: hero returns to (2,0) entrance → GAME_OVER
      current = tick(current.state, () => 0)
      expect(current.state.isGameOver).toBe(true)
      expect(current.events.some((e) => e.type === 'HERO_ESCAPED')).toBe(true)
      expect(current.events.some((e) => e.type === 'GAME_OVER')).toBe(true)

      // Tick 4: no processing after game over
      const afterGameOver = tick(current.state, () => 0)
      expect(afterGameOver.state.gameTime).toBe(current.state.gameTime)
      expect(afterGameOver.events).toHaveLength(0)
    })

    it('should confirm pickaxe attackMonster only accepts Monster type (not Hero)', () => {
      // attackMonster takes a monsterId string and searches state.monsters
      // Heroes are in state.heroes, not state.monsters
      // So pickaxe cannot target heroes by design
      const state = createGameState({
        heroes: [{
          kind: 'hero',
          id: 'hero-1',
          position: { x: 2, y: 2 },
          direction: 'down',
          life: 50,
          maxLife: 50,
          attack: 5,
          attackPattern: 'slash',
          visitedCells: new Set(),
          pathHistory: [],
          state: 'exploring',
          targetFound: false,
        }],
      })

      // Attempting to attack a hero id via attackMonster should return error (not found in monsters)
      const result = attackMonster(state, 'hero-1', 5)
      expect('error' in result).toBe(true)
      if ('error' in result) {
        expect(result.error).toBe('Monster not found')
      }
    })
  })
})
