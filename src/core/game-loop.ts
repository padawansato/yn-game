import type { GameState } from './types'

export type TickCallback = (state: GameState) => GameState

export class GameLoop {
  private state: GameState
  private onTick: TickCallback
  private tickInterval: number
  private intervalId: ReturnType<typeof setInterval> | null = null
  private paused: boolean = false

  constructor(state: GameState, onTick: TickCallback, tickInterval: number = 500) {
    this.state = state
    this.onTick = onTick
    this.tickInterval = tickInterval
  }

  start(): void {
    if (this.intervalId !== null) return

    this.paused = false
    this.intervalId = setInterval(() => {
      if (!this.paused) {
        this.state = this.onTick(this.state)
      }
    }, this.tickInterval)
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.paused = false
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  isRunning(): boolean {
    return this.intervalId !== null && !this.paused
  }

  isPaused(): boolean {
    return this.paused
  }

  getState(): GameState {
    return this.state
  }
}
