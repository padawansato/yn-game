import type { MovementPattern, MonsterType } from './types'
import {
  MONSTER_CONFIGS,
  NUTRIENT_CARRY_CAPACITY,
  NUTRIENT_RELEASE_THRESHOLD,
  HUNGER_THRESHOLD_RATIO,
  MOVEMENT_LIFE_COST,
  DEFAULT_GRID_WIDTH,
  DEFAULT_GRID_HEIGHT,
  MAX_NUTRIENT_PER_CELL,
  NUTRIENT_SPAWN_THRESHOLDS,
  INITIAL_DIG_POWER,
  PICKAXE_DAMAGE,
  BUD_NUTRIENT_THRESHOLD,
  BUD_LIFE_THRESHOLD,
  FLOWER_NUTRIENT_THRESHOLD,
  MOYOMOYO_DAMAGE,
  PUPA_NUTRIENT_THRESHOLD,
  PUPA_DURATION,
  GAJI_REPRO_LIFE_THRESHOLD,
  GAJI_REPRO_LIFE_COST,
  LAYING_NUTRIENT_THRESHOLD,
  LAYING_LIFE_THRESHOLD,
  LAYING_DURATION,
  EGG_HATCH_DURATION,
  NEST_NUTRIENT_COST,
  NEST_LIFE_COST,
  HERO_LIFE,
  HERO_ATTACK,
  HERO_SPAWN_START_TICK,
  HERO_SPAWN_INTERVAL,
  HERO_ANNOUNCE_TICKS,
  HERO_NUTRIENT_DROP,
} from './constants'

export interface MonsterTypeConfig {
  type: string
  pattern: MovementPattern
  life: number
  attack: number
  predationTargets: MonsterType[]
  canCarryNutrients: boolean
  // Nijirigoke lifecycle
  budNutrientThreshold?: number
  budLifeThreshold?: number
  minMobileTicks?: number
  minWitheredTicks?: number
  flowerNutrientThreshold?: number
  moyomoyoDamage?: number
  // Gajigajimushi lifecycle
  pupaNutrientThreshold?: number
  pupaDuration?: number
  reproLifeThreshold?: number
  reproLifeCost?: number
  // Lizardman lifecycle
  layingNutrientThreshold?: number
  layingLifeThreshold?: number
  layingDuration?: number
  eggHatchDuration?: number
  nestNutrientCost?: number
  nestLifeCost?: number
}

export interface GameConfig {
  grid: { defaultWidth: number; defaultHeight: number; maxNutrientPerCell: number }
  nutrient: { carryCapacity: number; releaseThreshold: number; hungerThresholdRatio: number }
  movement: { lifeCost: number }
  spawn: { thresholds: { type: string; minNutrient: number }[] }
  dig: { initialPower: number; pickaxeDamage: number }
  monsters: Record<string, MonsterTypeConfig>
  hero: {
    life: number
    attack: number
    spawnStartTick: number
    spawnInterval: number
    announceTicks: number
    nutrientDrop: number
  }
}

export function createDefaultConfig(): GameConfig {
  return {
    grid: {
      defaultWidth: DEFAULT_GRID_WIDTH,
      defaultHeight: DEFAULT_GRID_HEIGHT,
      maxNutrientPerCell: MAX_NUTRIENT_PER_CELL,
    },
    nutrient: {
      carryCapacity: NUTRIENT_CARRY_CAPACITY,
      releaseThreshold: NUTRIENT_RELEASE_THRESHOLD,
      hungerThresholdRatio: HUNGER_THRESHOLD_RATIO,
    },
    movement: {
      lifeCost: MOVEMENT_LIFE_COST,
    },
    spawn: {
      thresholds: [
        { type: 'gajigajimushi', minNutrient: NUTRIENT_SPAWN_THRESHOLDS.GAJIGAJIMUSHI },
        { type: 'lizardman', minNutrient: NUTRIENT_SPAWN_THRESHOLDS.LIZARDMAN },
      ],
    },
    dig: {
      initialPower: INITIAL_DIG_POWER,
      pickaxeDamage: PICKAXE_DAMAGE,
    },
    monsters: {
      nijirigoke: {
        type: 'nijirigoke',
        pattern: MONSTER_CONFIGS.nijirigoke.pattern,
        life: MONSTER_CONFIGS.nijirigoke.life,
        attack: MONSTER_CONFIGS.nijirigoke.attack,
        predationTargets: [...MONSTER_CONFIGS.nijirigoke.predationTargets],
        canCarryNutrients: MONSTER_CONFIGS.nijirigoke.canCarryNutrients,
        budNutrientThreshold: BUD_NUTRIENT_THRESHOLD,
        budLifeThreshold: BUD_LIFE_THRESHOLD,
        minMobileTicks: 8,
        minWitheredTicks: 3,
        flowerNutrientThreshold: FLOWER_NUTRIENT_THRESHOLD,
        moyomoyoDamage: MOYOMOYO_DAMAGE,
      },
      gajigajimushi: {
        type: 'gajigajimushi',
        pattern: MONSTER_CONFIGS.gajigajimushi.pattern,
        life: MONSTER_CONFIGS.gajigajimushi.life,
        attack: MONSTER_CONFIGS.gajigajimushi.attack,
        predationTargets: [...MONSTER_CONFIGS.gajigajimushi.predationTargets],
        canCarryNutrients: MONSTER_CONFIGS.gajigajimushi.canCarryNutrients,
        pupaNutrientThreshold: PUPA_NUTRIENT_THRESHOLD,
        pupaDuration: PUPA_DURATION,
        reproLifeThreshold: GAJI_REPRO_LIFE_THRESHOLD,
        reproLifeCost: GAJI_REPRO_LIFE_COST,
      },
      lizardman: {
        type: 'lizardman',
        pattern: MONSTER_CONFIGS.lizardman.pattern,
        life: MONSTER_CONFIGS.lizardman.life,
        attack: MONSTER_CONFIGS.lizardman.attack,
        predationTargets: [...MONSTER_CONFIGS.lizardman.predationTargets],
        canCarryNutrients: MONSTER_CONFIGS.lizardman.canCarryNutrients,
        layingNutrientThreshold: LAYING_NUTRIENT_THRESHOLD,
        layingLifeThreshold: LAYING_LIFE_THRESHOLD,
        layingDuration: LAYING_DURATION,
        eggHatchDuration: EGG_HATCH_DURATION,
        nestNutrientCost: NEST_NUTRIENT_COST,
        nestLifeCost: NEST_LIFE_COST,
      },
    },
    hero: {
      life: HERO_LIFE,
      attack: HERO_ATTACK,
      spawnStartTick: HERO_SPAWN_START_TICK,
      spawnInterval: HERO_SPAWN_INTERVAL,
      announceTicks: HERO_ANNOUNCE_TICKS,
      nutrientDrop: HERO_NUTRIENT_DROP,
    },
  }
}

export interface ConfigValidationError {
  path: string
  message: string
}

export function validateConfig(config: GameConfig): ConfigValidationError[] {
  const errors: ConfigValidationError[] = []

  // Grid positive checks
  if (config.grid.defaultWidth <= 0) {
    errors.push({ path: 'grid.defaultWidth', message: 'must be positive' })
  }
  if (config.grid.defaultHeight <= 0) {
    errors.push({ path: 'grid.defaultHeight', message: 'must be positive' })
  }
  if (config.grid.maxNutrientPerCell <= 0) {
    errors.push({ path: 'grid.maxNutrientPerCell', message: 'must be positive' })
  }

  // Nutrient positive checks
  if (config.nutrient.carryCapacity <= 0) {
    errors.push({ path: 'nutrient.carryCapacity', message: 'must be positive' })
  }
  if (config.nutrient.releaseThreshold <= 0) {
    errors.push({ path: 'nutrient.releaseThreshold', message: 'must be positive' })
  }
  if (config.nutrient.hungerThresholdRatio <= 0 || config.nutrient.hungerThresholdRatio > 1) {
    errors.push({ path: 'nutrient.hungerThresholdRatio', message: 'must be between 0 (exclusive) and 1 (inclusive)' })
  }

  // Movement positive check
  if (config.movement.lifeCost <= 0) {
    errors.push({ path: 'movement.lifeCost', message: 'must be positive' })
  }

  // Dig positive checks
  if (config.dig.initialPower <= 0) {
    errors.push({ path: 'dig.initialPower', message: 'must be positive' })
  }
  if (config.dig.pickaxeDamage <= 0) {
    errors.push({ path: 'dig.pickaxeDamage', message: 'must be positive' })
  }

  // Hero positive checks
  if (config.hero.life <= 0) {
    errors.push({ path: 'hero.life', message: 'must be positive' })
  }
  if (config.hero.attack <= 0) {
    errors.push({ path: 'hero.attack', message: 'must be positive' })
  }
  if (config.hero.spawnStartTick <= 0) {
    errors.push({ path: 'hero.spawnStartTick', message: 'must be positive' })
  }
  if (config.hero.spawnInterval <= 0) {
    errors.push({ path: 'hero.spawnInterval', message: 'must be positive' })
  }
  if (config.hero.announceTicks <= 0) {
    errors.push({ path: 'hero.announceTicks', message: 'must be positive' })
  }
  if (config.hero.nutrientDrop <= 0) {
    errors.push({ path: 'hero.nutrientDrop', message: 'must be positive' })
  }

  // Monster config checks
  const monsterTypes = Object.keys(config.monsters)
  for (const [key, monster] of Object.entries(config.monsters)) {
    const prefix = `monsters.${key}`
    if (monster.life <= 0) {
      errors.push({ path: `${prefix}.life`, message: 'must be positive' })
    }
    if (monster.attack < 0) {
      errors.push({ path: `${prefix}.attack`, message: 'must be non-negative' })
    }
    // Check predationTargets reference real types
    for (const target of monster.predationTargets) {
      if (!monsterTypes.includes(target)) {
        errors.push({ path: `${prefix}.predationTargets`, message: `references unknown type "${target}"` })
      }
    }
  }

  // Spawn threshold checks
  for (let i = 0; i < config.spawn.thresholds.length; i++) {
    const threshold = config.spawn.thresholds[i]
    if (threshold.minNutrient <= 0) {
      errors.push({ path: `spawn.thresholds[${i}].minNutrient`, message: 'must be positive' })
    }
    if (!monsterTypes.includes(threshold.type)) {
      errors.push({ path: `spawn.thresholds[${i}].type`, message: `references unknown type "${threshold.type}"` })
    }
  }

  return errors
}
