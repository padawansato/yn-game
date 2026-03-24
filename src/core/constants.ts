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

// Maximum nutrients a Nijirigoke can carry
export const NUTRIENT_CARRY_CAPACITY = 10

// Threshold for Nijirigoke to release nutrients (release when >= this amount)
export const NUTRIENT_RELEASE_THRESHOLD = 4

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

// Maximum nutrient amount per cell
export const MAX_NUTRIENT_PER_CELL = 100

// Initial dig power
export const INITIAL_DIG_POWER = 100

// Pickaxe damage per attack
export const PICKAXE_DAMAGE = 5

// === Metamorphosis thresholds ===

// Nijirigoke (コケ類) lifecycle
export const BUD_NUTRIENT_THRESHOLD = 6 // mobile → bud: carryingNutrient >= threshold
export const BUD_LIFE_THRESHOLD = 8 // mobile → bud: life <= threshold
export const FLOWER_NUTRIENT_THRESHOLD = 8 // bud → flower: carryingNutrient >= threshold

// Gajigajimushi (ムシ類) lifecycle
export const PUPA_NUTRIENT_THRESHOLD = 5 // larva → pupa: carryingNutrient >= threshold
export const PUPA_DURATION = 10 // pupa → adult: ticks to wait

// Lizardman (トカゲ類) lifecycle
export const LAYING_NUTRIENT_THRESHOLD = 5 // normal/nesting → laying: carryingNutrient >= threshold
export const LAYING_LIFE_THRESHOLD = 40 // normal/nesting → laying: life >= threshold
export const LAYING_DURATION = 15 // laying → egg spawn: ticks to wait
export const EGG_HATCH_DURATION = 20 // egg → hatch: ticks to wait
