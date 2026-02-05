import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameLoop } from './game-loop'
import type { Cell, GameState } from './types'

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0 }))
  )
}

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    grid: createGrid(5, 5),
    monsters: [],
    totalInitialNutrients: 100,
    digPower: 100,
    gameTime: 0,
    ...overrides,
  }
}

describe('GameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('start and stop', () => {
    it('should call onTick at configured interval when started', () => {
      const state = createGameState()
      const onTick = vi.fn((s: GameState) => s)
      const loop = new GameLoop(state, onTick, 500)

      loop.start()
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(2)

      loop.stop()
    })

    it('should stop calling onTick when stopped', () => {
      const state = createGameState()
      const onTick = vi.fn((s: GameState) => s)
      const loop = new GameLoop(state, onTick, 500)

      loop.start()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.stop()
      vi.advanceTimersByTime(1000)
      expect(onTick).toHaveBeenCalledTimes(1)
    })

    it('should report running state correctly', () => {
      const state = createGameState()
      const onTick = vi.fn((s: GameState) => s)
      const loop = new GameLoop(state, onTick, 500)

      expect(loop.isRunning()).toBe(false)

      loop.start()
      expect(loop.isRunning()).toBe(true)

      loop.stop()
      expect(loop.isRunning()).toBe(false)
    })
  })

  describe('pause and resume', () => {
    it('should pause tick execution', () => {
      const state = createGameState()
      const onTick = vi.fn((s: GameState) => s)
      const loop = new GameLoop(state, onTick, 500)

      loop.start()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.pause()
      vi.advanceTimersByTime(1000)
      expect(onTick).toHaveBeenCalledTimes(1)
    })

    it('should resume tick execution after pause', () => {
      const state = createGameState()
      const onTick = vi.fn((s: GameState) => s)
      const loop = new GameLoop(state, onTick, 500)

      loop.start()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.pause()
      vi.advanceTimersByTime(1000)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.resume()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(2)
    })

    it('should report paused state correctly', () => {
      const state = createGameState()
      const onTick = vi.fn((s: GameState) => s)
      const loop = new GameLoop(state, onTick, 500)

      loop.start()
      expect(loop.isPaused()).toBe(false)

      loop.pause()
      expect(loop.isPaused()).toBe(true)

      loop.resume()
      expect(loop.isPaused()).toBe(false)
    })
  })

  describe('gameTime tracking', () => {
    it('should increment gameTime on each tick', () => {
      const state = createGameState({ gameTime: 0 })
      const loop = new GameLoop(state, (s) => ({ ...s, gameTime: s.gameTime + 1 }), 500)

      loop.start()
      vi.advanceTimersByTime(500)
      expect(loop.getState().gameTime).toBe(1)

      vi.advanceTimersByTime(500)
      expect(loop.getState().gameTime).toBe(2)

      vi.advanceTimersByTime(500)
      expect(loop.getState().gameTime).toBe(3)

      loop.stop()
    })

    it('should preserve gameTime when paused', () => {
      const state = createGameState({ gameTime: 0 })
      const loop = new GameLoop(state, (s) => ({ ...s, gameTime: s.gameTime + 1 }), 500)

      loop.start()
      vi.advanceTimersByTime(1000) // 2 ticks
      expect(loop.getState().gameTime).toBe(2)

      loop.pause()
      vi.advanceTimersByTime(2000)
      expect(loop.getState().gameTime).toBe(2) // unchanged

      loop.stop()
    })
  })

  describe('custom tick interval', () => {
    it('should use default interval of 500ms', () => {
      const state = createGameState()
      const onTick = vi.fn((s: GameState) => s)
      const loop = new GameLoop(state, onTick)

      loop.start()

      vi.advanceTimersByTime(499)
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.stop()
    })

    it('should allow custom tick interval', () => {
      const state = createGameState()
      const onTick = vi.fn((s: GameState) => s)
      const loop = new GameLoop(state, onTick, 1000)

      loop.start()

      vi.advanceTimersByTime(500)
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.stop()
    })
  })
})
