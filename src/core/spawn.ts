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

export function getMonsterTypeByNutrient(nutrientAmount: number, config: GameConfig): MonsterType {
  // Sort thresholds descending by minNutrient to check highest first
  const sorted = [...config.spawn.thresholds].sort((a, b) => b.minNutrient - a.minNutrient)
  for (const threshold of sorted) {
    if (nutrientAmount >= threshold.minNutrient) {
      return threshold.type as MonsterType
    }
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

  // Make entrance cell empty (heroes spawn here, spec requires it to be empty)
  grid[entrancePosition.y][entrancePosition.x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }

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
      spawnStartTick: resolvedConfig.hero.spawnStartTick,
      spawnInterval: resolvedConfig.hero.spawnInterval,
      heroesSpawned: 0,
    },
    totalInitialNutrients: 0,
    digPower: resolvedConfig.dig.initialPower,
    gameTime: 0,
    nextMonsterId: 0,
    nextHeroId: 0,
    isGameOver: false,
    config: resolvedConfig,
  }
}
