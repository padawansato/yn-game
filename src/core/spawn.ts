import {
  NUTRIENT_SPAWN_THRESHOLDS,
  INITIAL_DIG_POWER,
  HERO_SPAWN_START_TICK,
  HERO_SPAWN_INTERVAL,
} from './constants'
import { createDefaultConfig } from './config'
import type { GameConfig } from './config'
import type {
  Cell,
  GameState,
  MonsterType,
  MonsterPhase,
  Position,
} from './types'

export const INITIAL_PHASE: Record<MonsterType, MonsterPhase> = {
  nijirigoke: 'mobile',
  gajigajimushi: 'larva',
  lizardman: 'normal',
}

export function generateMonsterId(state: GameState): { id: string; nextMonsterId: number } {
  const id = `monster-${state.nextMonsterId + 1}`
  return { id, nextMonsterId: state.nextMonsterId + 1 }
}

export function getMonsterTypeByNutrient(nutrientAmount: number): MonsterType {
  if (nutrientAmount >= NUTRIENT_SPAWN_THRESHOLDS.LIZARDMAN) {
    return 'lizardman'
  }
  if (nutrientAmount >= NUTRIENT_SPAWN_THRESHOLDS.GAJIGAJIMUSHI) {
    return 'gajigajimushi'
  }
  return 'nijirigoke'
}

/**
 * Create initial game state
 * Includes an initial empty cell at the top center for digging entry point
 */
export interface CreateGameStateOptions {
  demonLordPosition?: Position
}

export function createGameState(
  width: number,
  height: number,
  soilRatio: number = 0.7,
  options: CreateGameStateOptions = {},
  config?: GameConfig,
): GameState {
  const resolvedConfig = config ?? createDefaultConfig()
  const grid: Cell[][] = []

  // Calculate entry point position (top center, one row below the wall)
  const entryX = Math.floor(width / 2)
  const entryY = 1

  const entrancePosition: Position = { x: Math.floor(width / 2), y: 0 }
  const demonLordPosition: Position | null = options.demonLordPosition ?? null

  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      // Borders are walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0, magicAmount: 0 })
      } else if (x === entryX && y === entryY) {
        row.push({ type: 'empty', nutrientAmount: 0, magicAmount: 0 })
      } else if (Math.random() < soilRatio) {
        row.push({ type: 'soil', nutrientAmount: 0, magicAmount: 0 })
      } else {
        row.push({ type: 'empty', nutrientAmount: 0, magicAmount: 0 })
      }
    }
    grid.push(row)
  }

  // Entrance stays as wall (monsters can't enter, heroes spawn directly)
  if (demonLordPosition) {
    grid[demonLordPosition.y][demonLordPosition.x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
  }

  return {
    grid,
    monsters: [],
    heroes: [],
    entrancePosition,
    demonLordPosition,
    heroSpawnConfig: {
      partySize: 1,
      spawnStartTick: HERO_SPAWN_START_TICK,
      spawnInterval: HERO_SPAWN_INTERVAL,
      heroesSpawned: 0,
    },
    totalInitialNutrients: 0,
    digPower: INITIAL_DIG_POWER,
    gameTime: 0,
    nextMonsterId: 0,
    nextHeroId: 0,
    isGameOver: false,
    config: resolvedConfig,
  }
}
