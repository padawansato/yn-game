import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GameLoop } from './game-loop'

describe('GameLoop', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('start and stop', () => {
    it('should call onTick at configured interval when started', () => {
      const onTick = vi.fn()
      const loop = new GameLoop(onTick, 500)

      loop.start()
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(2)

      loop.stop()
    })

    it('should stop calling onTick when stopped', () => {
      const onTick = vi.fn()
      const loop = new GameLoop(onTick, 500)

      loop.start()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.stop()
      vi.advanceTimersByTime(1000)
      expect(onTick).toHaveBeenCalledTimes(1)
    })

    it('should report running state correctly', () => {
      const onTick = vi.fn()
      const loop = new GameLoop(onTick, 500)

      expect(loop.isRunning()).toBe(false)

      loop.start()
      expect(loop.isRunning()).toBe(true)

      loop.stop()
      expect(loop.isRunning()).toBe(false)
    })
  })

  describe('pause and resume', () => {
    it('should pause tick execution', () => {
      const onTick = vi.fn()
      const loop = new GameLoop(onTick, 500)

      loop.start()
      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.pause()
      vi.advanceTimersByTime(1000)
      expect(onTick).toHaveBeenCalledTimes(1)
    })

    it('should resume tick execution after pause', () => {
      const onTick = vi.fn()
      const loop = new GameLoop(onTick, 500)

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
      const onTick = vi.fn()
      const loop = new GameLoop(onTick, 500)

      loop.start()
      expect(loop.isPaused()).toBe(false)

      loop.pause()
      expect(loop.isPaused()).toBe(true)

      loop.resume()
      expect(loop.isPaused()).toBe(false)
    })
  })

  describe('gameTime tracking via external state', () => {
    it('should allow external state management via callback', () => {
      let gameTime = 0
      const loop = new GameLoop(() => { gameTime++ }, 500)

      loop.start()
      vi.advanceTimersByTime(500)
      expect(gameTime).toBe(1)

      vi.advanceTimersByTime(500)
      expect(gameTime).toBe(2)

      vi.advanceTimersByTime(500)
      expect(gameTime).toBe(3)

      loop.stop()
    })

    it('should preserve external state when paused', () => {
      let gameTime = 0
      const loop = new GameLoop(() => { gameTime++ }, 500)

      loop.start()
      vi.advanceTimersByTime(1000) // 2 ticks
      expect(gameTime).toBe(2)

      loop.pause()
      vi.advanceTimersByTime(2000)
      expect(gameTime).toBe(2) // unchanged

      loop.stop()
    })
  })

  describe('custom tick interval', () => {
    it('should use default interval of 500ms', () => {
      const onTick = vi.fn()
      const loop = new GameLoop(onTick)

      loop.start()

      vi.advanceTimersByTime(499)
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(1)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.stop()
    })

    it('should allow custom tick interval', () => {
      const onTick = vi.fn()
      const loop = new GameLoop(onTick, 1000)

      loop.start()

      vi.advanceTimersByTime(500)
      expect(onTick).not.toHaveBeenCalled()

      vi.advanceTimersByTime(500)
      expect(onTick).toHaveBeenCalledTimes(1)

      loop.stop()
    })
  })
})
