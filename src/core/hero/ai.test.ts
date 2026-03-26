import { describe, it, expect } from 'vitest'
import { calculateHeroMove } from './ai'
import type { GameState } from '../types'
import type { HeroEntity } from './types'
import { createGameState } from '../simulation'

/** Create a small 5x5 grid with all inner cells empty */
function createTestState(overrides?: Partial<GameState>): GameState {
  // soilRatio=0 → all inner cells are empty, borders are walls
  const state = createGameState(5, 5, 0)
  return { ...state, ...overrides }
}

/** Create a hero entity with defaults */
function createHero(overrides?: Partial<HeroEntity>): HeroEntity {
  return {
    kind: 'hero',
    id: 'hero-1',
    position: { x: 2, y: 1 },
    direction: 'down',
    life: 10,
    maxLife: 10,
    attack: 3,
    attackPattern: 'slash',
    visitedCells: new Set<string>(['2,1']),
    pathHistory: [{ x: 2, y: 1 }],
    state: 'exploring',
    targetFound: false,
    ...overrides,
  }
}

describe('calculateHeroMove', () => {
  describe('Exploration movement', () => {
    it('前方がempty未踏 → 前進', () => {
      const state = createTestState()
      const hero = createHero({
        position: { x: 2, y: 1 },
        direction: 'down',
        visitedCells: new Set(['2,1']),
        pathHistory: [{ x: 2, y: 1 }],
      })

      const result = calculateHeroMove(hero, state)

      expect(result.hero.position).toEqual({ x: 2, y: 2 })
      expect(result.hero.direction).toBe('down')
      expect(result.hero.visitedCells.has('2,2')).toBe(true)
      expect(result.hero.pathHistory).toContainEqual({ x: 2, y: 2 })
    })

    it('前方がwall → 未踏の隣接セルに方向転換', () => {
      const state = createTestState()
      // Hero at (1,1) facing left → wall at (0,1)
      const hero = createHero({
        position: { x: 1, y: 1 },
        direction: 'left',
        visitedCells: new Set(['1,1']),
        pathHistory: [{ x: 1, y: 1 }],
      })

      const result = calculateHeroMove(hero, state)

      // Should not move into wall, should pick an unvisited passable neighbor
      expect(result.hero.position).not.toEqual({ x: 0, y: 1 })
      expect(result.hero.position).not.toEqual({ x: 1, y: 1 })
      // Should have moved to one of the passable unvisited neighbors
      const newPos = result.hero.position
      expect(
        (newPos.x === 1 && newPos.y === 2) || // down
        (newPos.x === 2 && newPos.y === 1)     // right
      ).toBe(true)
    })

    it('前方がsoil → impassableとして扱う', () => {
      const state = createTestState()
      // Set cell (2,2) to soil
      state.grid[2][2] = { type: 'soil', nutrientAmount: 0, magicAmount: 0 }

      const hero = createHero({
        position: { x: 2, y: 1 },
        direction: 'down',
        visitedCells: new Set(['2,1']),
        pathHistory: [{ x: 2, y: 1 }],
      })

      const result = calculateHeroMove(hero, state)

      // Should not move into soil
      expect(result.hero.position).not.toEqual({ x: 2, y: 2 })
    })

    it('全隣接passableセルが踏破済み → pathHistoryバックトラック', () => {
      const state = createTestState()
      // Hero at (2,2), all adjacent empty cells already visited
      const hero = createHero({
        position: { x: 2, y: 2 },
        direction: 'down',
        visitedCells: new Set(['2,1', '2,2', '1,2', '3,2', '2,3']),
        pathHistory: [{ x: 2, y: 1 }, { x: 2, y: 2 }],
      })

      const result = calculateHeroMove(hero, state)

      // Should backtrack to (2,1) - the previous position in pathHistory
      expect(result.hero.position).toEqual({ x: 2, y: 1 })
    })

    it('visitedCells が正しく更新される', () => {
      const state = createTestState()
      const hero = createHero({
        position: { x: 2, y: 1 },
        direction: 'down',
        visitedCells: new Set(['2,1']),
        pathHistory: [{ x: 2, y: 1 }],
      })

      const result = calculateHeroMove(hero, state)

      expect(result.hero.visitedCells.has('2,1')).toBe(true)
      expect(result.hero.visitedCells.has('2,2')).toBe(true)
      expect(result.hero.visitedCells.size).toBe(2)
    })

    it('pathHistory が探索時にpushされる', () => {
      const state = createTestState()
      const hero = createHero({
        position: { x: 2, y: 1 },
        direction: 'down',
        visitedCells: new Set(['2,1']),
        pathHistory: [{ x: 2, y: 1 }],
      })

      const result = calculateHeroMove(hero, state)

      expect(result.hero.pathHistory).toEqual([
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ])
    })

    it('方向転換時にrandomFnで選択を制御できる', () => {
      const state = createTestState()
      // Hero at (1,1) facing left (wall). Passable unvisited: down(1,2), right(2,1)
      // up(1,0) is wall
      const hero = createHero({
        position: { x: 1, y: 1 },
        direction: 'left',
        visitedCells: new Set(['1,1']),
        pathHistory: [{ x: 1, y: 1 }],
      })

      // randomFn returns 0 → pick first candidate
      const result1 = calculateHeroMove(hero, state, () => 0)
      // randomFn returns 0.99 → pick last candidate
      const result2 = calculateHeroMove(hero, state, () => 0.999)

      // They should pick different candidates (or the same if only one)
      // At minimum, both should be valid moves
      expect(result1.hero.position).not.toEqual({ x: 1, y: 1 })
      expect(result2.hero.position).not.toEqual({ x: 1, y: 1 })
    })

    it('グリッド境界外は impassable', () => {
      const state = createTestState()
      // Hero at (1,1) facing up → (1,0) is wall
      // Also visited (2,1) and (1,2) so only right (2,1) is visited
      const hero = createHero({
        position: { x: 1, y: 1 },
        direction: 'up',
        visitedCells: new Set(['1,1']),
        pathHistory: [{ x: 1, y: 1 }],
      })

      const result = calculateHeroMove(hero, state)

      // Should not move to wall (1,0), should pick a passable unvisited neighbor
      expect(result.hero.position).not.toEqual({ x: 1, y: 0 })
      expect(result.hero.position).not.toEqual({ x: 0, y: 1 })
    })
  })

  describe('Demon lord discovery', () => {
    it('demonLordPositionに到達 → state=returning, DEMON_LORD_FOUND', () => {
      const demonLordPos = { x: 2, y: 3 }
      const state = createTestState({ demonLordPosition: demonLordPos })

      const hero = createHero({
        position: { x: 2, y: 2 },
        direction: 'down',
        visitedCells: new Set(['2,1', '2,2']),
        pathHistory: [{ x: 2, y: 1 }, { x: 2, y: 2 }],
      })

      const result = calculateHeroMove(hero, state)

      expect(result.hero.position).toEqual({ x: 2, y: 3 })
      expect(result.hero.state).toBe('returning')
      expect(result.hero.targetFound).toBe(true)
      expect(result.events).toContainEqual({
        type: 'DEMON_LORD_FOUND',
        heroId: 'hero-1',
      })
    })
  })

  describe('Return movement', () => {
    it('帰還モード: pathHistory逆順を辿る', () => {
      const state = createTestState()
      const hero = createHero({
        position: { x: 2, y: 3 },
        direction: 'down',
        state: 'returning',
        targetFound: true,
        visitedCells: new Set(['2,1', '2,2', '2,3']),
        pathHistory: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
      })

      const result = calculateHeroMove(hero, state)

      // Should pop last from pathHistory and move to previous
      expect(result.hero.position).toEqual({ x: 2, y: 2 })
      expect(result.hero.pathHistory).toEqual([
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ])
    })

    it('帰還時にdirectionが移動方向に合わせて更新される', () => {
      const state = createTestState()
      const hero = createHero({
        position: { x: 2, y: 3 },
        direction: 'down',
        state: 'returning',
        targetFound: true,
        visitedCells: new Set(['2,1', '2,2', '2,3']),
        pathHistory: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
      })

      const result = calculateHeroMove(hero, state)

      // Moving from (2,3) to (2,2) is up
      expect(result.hero.direction).toBe('up')
    })

    it('帰還完了: entrancePositionに到達 → HERO_ESCAPED', () => {
      const entrancePos = { x: 2, y: 0 }
      const state = createTestState({ entrancePosition: entrancePos })
      // Make entrance cell passable for this test
      state.grid[0][2] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }

      const hero = createHero({
        position: { x: 2, y: 1 },
        direction: 'up',
        state: 'returning',
        targetFound: true,
        visitedCells: new Set(['2,0', '2,1', '2,2']),
        pathHistory: [{ x: 2, y: 0 }, { x: 2, y: 1 }],
      })

      const result = calculateHeroMove(hero, state)

      expect(result.hero.position).toEqual({ x: 2, y: 0 })
      expect(result.events).toContainEqual({
        type: 'HERO_ESCAPED',
        heroId: 'hero-1',
      })
    })

    it('pathHistory が帰還時にpopされる', () => {
      const state = createTestState()
      const hero = createHero({
        position: { x: 2, y: 3 },
        direction: 'down',
        state: 'returning',
        targetFound: true,
        visitedCells: new Set(['2,1', '2,2', '2,3']),
        pathHistory: [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
      })

      const result = calculateHeroMove(hero, state)

      // Current position (2,3) should be popped
      expect(result.hero.pathHistory).toEqual([
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ])
    })
  })
})
