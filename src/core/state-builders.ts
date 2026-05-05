import type { Cell, GameState, Monster, MonsterType, MonsterPhase } from './types'
import type { GameConfig } from './config'
import { getTotalNutrients } from './nutrient'

export interface MonsterSetup {
  type: MonsterType
  position: { x: number; y: number }
  nestPosition?: { x: number; y: number } | null
  nestOrientation?: 'horizontal' | 'vertical' | null
  life: number
  carryingNutrient: number
  phase: MonsterPhase
}

/**
 * Build a width×height grid where the borders are walls and the interior is empty.
 * Used by debug scenarios that want a clean arena without random soil placement.
 */
export function makeEmptyArena(width: number, height: number): Cell[][] {
  const grid: Cell[][] = []
  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0, magicAmount: 0 })
      } else {
        row.push({ type: 'empty', nutrientAmount: 0, magicAmount: 0 })
      }
    }
    grid.push(row)
  }
  return grid
}

/**
 * Construct a GameState from a hand-crafted grid + monster setup list.
 * Pure: takes config explicitly. Used by debug scenarios.
 */
export function makeScenarioState(
  grid: Cell[][],
  monsterSetups: MonsterSetup[],
  config: GameConfig,
): GameState {
  const monsters: Monster[] = monsterSetups.map((s, idx) => {
    const mConfig = config.monsters[s.type]
    return {
      id: `monster-${idx + 1}`,
      type: s.type,
      position: { ...s.position },
      direction: 'right' as const,
      pattern: mConfig.pattern,
      phase: s.phase,
      phaseTickCounter: 0,
      life: s.life,
      maxLife: mConfig.life,
      attack: mConfig.attack,
      predationTargets: [...mConfig.predationTargets],
      carryingNutrient: s.carryingNutrient,
      nestPosition: s.nestPosition ? { ...s.nestPosition } : null,
      nestOrientation: s.nestOrientation ?? null,
    }
  })

  const heroDefaults = {
    heroes: [],
    entrancePosition: { x: Math.floor(grid[0].length / 2), y: 0 },
    demonLordPosition: null,
    heroSpawnConfig: { partySize: 1, spawnStartTick: 100, spawnInterval: 10, heroesSpawned: 0 },
    nextHeroId: 0,
    isGameOver: false,
  }

  const totalNutrients = getTotalNutrients({
    grid,
    monsters,
    totalInitialNutrients: 0,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: 0,
    ...heroDefaults,
    config,
  })

  return {
    grid,
    monsters,
    totalInitialNutrients: totalNutrients,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: monsterSetups.length,
    ...heroDefaults,
    config,
  }
}
