import type { MonsterType, MovementPattern } from './types'

// Monster stats configuration (based on CEDEC 2008)
export interface MonsterConfig {
  type: MonsterType
  pattern: MovementPattern
  life: number
  attack: number
  predationTargets: MonsterType[]
  canCarryNutrients: boolean
}

export const MONSTER_CONFIGS: Record<MonsterType, MonsterConfig> = {
  nijirigoke: {
    type: 'nijirigoke',
    pattern: 'straight',
    life: 16,
    attack: 0,
    predationTargets: [],
    canCarryNutrients: true,
  },
  gajigajimushi: {
    type: 'gajigajimushi',
    pattern: 'refraction',
    life: 30,
    attack: 3,
    predationTargets: ['nijirigoke'],
    canCarryNutrients: false,
  },
  lizardman: {
    type: 'lizardman',
    pattern: 'stationary',
    life: 80,
    attack: 8,
    predationTargets: ['nijirigoke', 'gajigajimushi'],
    canCarryNutrients: false,
  },
}

// Nutrient depletion ratio when digging (30% lost)
export const NUTRIENT_DEPLETION_RATIO = 0.3

// Maximum nutrients a Nijirigoke can carry
export const NUTRIENT_CARRY_CAPACITY = 10

// Threshold for Nijirigoke to release nutrients (release when >= this amount)
export const NUTRIENT_RELEASE_THRESHOLD = 2

// Hunger threshold (30% of maxLife)
export const HUNGER_THRESHOLD_RATIO = 0.3

// Life cost per movement
export const MOVEMENT_LIFE_COST = 1

// Grid dimensions (default)
export const DEFAULT_GRID_WIDTH = 20
export const DEFAULT_GRID_HEIGHT = 15

// Threshold of spawn monster
export const NUTRIENT_SPAWN_THRESHOLDS = {
  GAJIGAJIMUSHI: 10,
  LIZARDMAN: 17,
} as const

// Initial dig power
export const INITIAL_DIG_POWER = 100