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
    life: 24,
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
    life: 120,
    attack: 15,
    predationTargets: ['nijirigoke', 'gajigajimushi'],
    canCarryNutrients: false,
  },
}

// Maximum nutrients a Nijirigoke can carry
export const NUTRIENT_CARRY_CAPACITY = 10

// Threshold for Nijirigoke to release nutrients (release when >= this amount)
export const NUTRIENT_RELEASE_THRESHOLD = 8

// Hunger threshold (30% of maxLife)
export const HUNGER_THRESHOLD_RATIO = 0.3

// Life cost per movement
export const MOVEMENT_LIFE_COST = 1

// Grid size presets (SSoT for discrete grid dimensions)
// Runtime-switchable via UI. Default startup uses `small`.
export const GRID_PRESETS = {
  small: { width: 10, height: 8 },
  large: { width: 30, height: 40 },
} as const

export type GridPresetKey = keyof typeof GRID_PRESETS

// Default grid dimensions (derived from the `small` preset to preserve existing behavior)
export const DEFAULT_GRID_WIDTH = GRID_PRESETS.small.width
export const DEFAULT_GRID_HEIGHT = GRID_PRESETS.small.height

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
export const BUD_NUTRIENT_THRESHOLD = 4 // mobile → bud: carryingNutrient >= threshold
export const BUD_LIFE_THRESHOLD = 16 // mobile → bud: life <= threshold
export const FLOWER_NUTRIENT_THRESHOLD = 8 // bud → flower: carryingNutrient >= threshold

// Gajigajimushi (ムシ類) lifecycle
export const PUPA_NUTRIENT_THRESHOLD = 5 // larva → pupa: carryingNutrient >= threshold
export const PUPA_DURATION = 6 // pupa → adult: ticks to wait

// Lizardman (トカゲ類) lifecycle
export const LAYING_NUTRIENT_THRESHOLD = 5 // normal/nesting → laying: carryingNutrient >= threshold
export const LAYING_LIFE_THRESHOLD = 40 // normal/nesting → laying: life >= threshold
export const LAYING_DURATION = 15 // laying → egg spawn: ticks to wait
export const EGG_HATCH_DURATION = 20 // egg → hatch: ticks to wait

// Nest building cost
export const NEST_NUTRIENT_COST = 14   // nutrients consumed when building a nest
export const NEST_LIFE_COST = 2        // life consumed when building a nest

// Gajigajimushi reproduction
export const GAJI_REPRO_LIFE_THRESHOLD = 6  // minimum life to reproduce
export const GAJI_REPRO_LIFE_COST = 5        // life cost per reproduction

// Moyomoyo (flower ranged attack)
export const MOYOMOYO_DAMAGE = 2  // flower ranged attack damage per tick

// === Hero constants ===
export const HERO_LIFE = 50
export const HERO_ATTACK = 5
export const HERO_SPAWN_START_TICK = 100
export const HERO_SPAWN_INTERVAL = 10
export const HERO_ANNOUNCE_TICKS = 20
export const HERO_NUTRIENT_DROP = 15
