import type { Position, Direction } from '../types'

export type HeroState = 'exploring' | 'returning' | 'dead'
export type HeroAttackPattern = 'slash'

export interface HeroEntity {
  kind: 'hero'
  id: string
  position: Position
  direction: Direction
  life: number
  maxLife: number
  attack: number
  attackPattern: HeroAttackPattern
  visitedCells: Set<string>
  pathHistory: Position[]
  state: HeroState
  targetFound: boolean
}

export interface HeroSpawnConfig {
  partySize: number
  spawnStartTick: number
  spawnInterval: number
  heroesSpawned: number
}
