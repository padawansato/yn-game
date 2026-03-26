import type { Cell, GameState, Monster, MonsterType, MonsterPhase } from '../core/types'
import {
  MONSTER_CONFIGS,
  LAYING_LIFE_THRESHOLD,
  LAYING_NUTRIENT_THRESHOLD,
  BUD_LIFE_THRESHOLD,
  PUPA_NUTRIENT_THRESHOLD,
} from '../core/constants'
import { getTotalNutrients } from '../core/nutrient'

// ---------- Public interface ----------

export interface Scenario {
  name: string
  description: string
  setup: () => GameState
}

/**
 * Returns every available debug scenario.
 */
export function getScenarios(): Scenario[] {
  return scenarios
}

/**
 * Looks up a scenario by name and returns its GameState, or null if not found.
 */
export function loadScenario(name: string): GameState | null {
  const scenario = scenarios.find((s) => s.name === name)
  if (!scenario) return null
  return scenario.setup()
}

// ---------- Arena helper ----------

/**
 * Creates a grid of the given size with walls on the border and empty cells inside.
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

// ---------- Internal helpers ----------

interface MonsterSetup {
  type: MonsterType
  position: { x: number; y: number }
  nestPosition?: { x: number; y: number } | null
  nestOrientation?: 'horizontal' | 'vertical' | null
  life: number
  carryingNutrient: number
  phase: MonsterPhase
}

let monsterIdCounter = 0

function makeState(grid: Cell[][], monsterSetups: MonsterSetup[]): GameState {
  monsterIdCounter = 0
  const monsters: Monster[] = monsterSetups.map((s) => {
    monsterIdCounter++
    const config = MONSTER_CONFIGS[s.type]
    return {
      id: `monster-${monsterIdCounter}`,
      type: s.type,
      position: { ...s.position },
      direction: 'right' as const,
      pattern: config.pattern,
      phase: s.phase,
      phaseTickCounter: 0,
      life: s.life,
      maxLife: config.life,
      attack: config.attack,
      predationTargets: [...config.predationTargets],
      carryingNutrient: s.carryingNutrient,
      nestPosition: s.nestPosition ? { ...s.nestPosition } : null,
      nestOrientation: s.nestOrientation ?? null,
    }
  })

  const heroDefaults = {
    heroes: [] as import('../core/hero/types').HeroEntity[],
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
  })

  return {
    grid,
    monsters,
    totalInitialNutrients: totalNutrients,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: monsterIdCounter,
    ...heroDefaults,
  }
}

// ---------- Scenario definitions ----------

const scenarios: Scenario[] = [
  {
    name: 'lizardman-egg',
    description: 'Lizardman with nest, nutrients & life above laying thresholds → laying → egg → hatch',
    setup() {
      const grid = makeEmptyArena(12, 10)
      return makeState(grid, [
        {
          type: 'lizardman',
          position: { x: 5, y: 4 },
          nestPosition: { x: 5, y: 4 },
          nestOrientation: 'horizontal' as const,
          life: LAYING_LIFE_THRESHOLD + 20,
          carryingNutrient: LAYING_NUTRIENT_THRESHOLD + 5,
          phase: 'normal',
        },
      ])
    },
  },
  {
    name: 'nijirigoke-metamorphosis',
    description: 'Nijirigoke moves, absorbs nutrients, then bud → flower → withered → reproduction',
    setup() {
      const grid = makeEmptyArena(12, 10)
      // Create a corridor with nutrient-rich soil on the sides
      // Empty corridor for movement: y=4, x=2..9
      // Soil walls with nutrients on y=3 and y=5
      for (let x = 2; x <= 9; x++) {
        grid[3][x] = { type: 'soil', nutrientAmount: 6, magicAmount: 0 }
        grid[5][x] = { type: 'soil', nutrientAmount: 6, magicAmount: 0 }
      }
      return makeState(grid, [
        {
          type: 'nijirigoke',
          position: { x: 3, y: 4 },
          life: BUD_LIFE_THRESHOLD, // life=8, already at bud threshold
          carryingNutrient: 3, // absorbs from soil to reach BUD_NUTRIENT_THRESHOLD(6)
          phase: 'mobile',
        },
      ])
    },
  },
  {
    name: 'gajigajimushi-metamorphosis',
    description: 'Gajigajimushi larva above pupa threshold → pupa → adult',
    setup() {
      const grid = makeEmptyArena(12, 10)
      return makeState(grid, [
        {
          type: 'gajigajimushi',
          position: { x: 5, y: 4 },
          life: 25,
          carryingNutrient: PUPA_NUTRIENT_THRESHOLD + 3,
          phase: 'larva',
        },
      ])
    },
  },
  {
    name: 'predation-chain',
    description: 'All 3 monster types near each other for predation interactions',
    setup() {
      const grid = makeEmptyArena(12, 10)
      return makeState(grid, [
        {
          type: 'lizardman',
          position: { x: 5, y: 4 },
          life: 60,
          carryingNutrient: 3,
          phase: 'normal',
        },
        {
          type: 'gajigajimushi',
          position: { x: 6, y: 4 },
          life: 20,
          carryingNutrient: 3,
          phase: 'larva',
        },
        {
          type: 'nijirigoke',
          position: { x: 7, y: 4 },
          life: 10,
          carryingNutrient: 3,
          phase: 'mobile',
        },
        {
          type: 'nijirigoke',
          position: { x: 4, y: 4 },
          life: 10,
          carryingNutrient: 3,
          phase: 'mobile',
        },
      ])
    },
  },
]
