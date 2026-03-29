import { describe, it, expect } from 'vitest'
import { createDefaultConfig, validateConfig, type GameConfig } from './config'
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

describe('GameConfig', () => {
  describe('createDefaultConfig', () => {
    it('should match constants.ts grid values', () => {
      const config = createDefaultConfig()
      expect(config.grid.defaultWidth).toBe(DEFAULT_GRID_WIDTH)
      expect(config.grid.defaultHeight).toBe(DEFAULT_GRID_HEIGHT)
      expect(config.grid.maxNutrientPerCell).toBe(MAX_NUTRIENT_PER_CELL)
    })

    it('should match constants.ts nutrient values', () => {
      const config = createDefaultConfig()
      expect(config.nutrient.carryCapacity).toBe(NUTRIENT_CARRY_CAPACITY)
      expect(config.nutrient.releaseThreshold).toBe(NUTRIENT_RELEASE_THRESHOLD)
      expect(config.nutrient.hungerThresholdRatio).toBe(HUNGER_THRESHOLD_RATIO)
    })

    it('should match constants.ts movement values', () => {
      const config = createDefaultConfig()
      expect(config.movement.lifeCost).toBe(MOVEMENT_LIFE_COST)
    })

    it('should match constants.ts spawn thresholds', () => {
      const config = createDefaultConfig()
      expect(config.spawn.thresholds).toEqual([
        { type: 'gajigajimushi', minNutrient: NUTRIENT_SPAWN_THRESHOLDS.GAJIGAJIMUSHI },
        { type: 'lizardman', minNutrient: NUTRIENT_SPAWN_THRESHOLDS.LIZARDMAN },
      ])
    })

    it('should match constants.ts dig values', () => {
      const config = createDefaultConfig()
      expect(config.dig.initialPower).toBe(INITIAL_DIG_POWER)
      expect(config.dig.pickaxeDamage).toBe(PICKAXE_DAMAGE)
    })

    it('should match constants.ts hero values', () => {
      const config = createDefaultConfig()
      expect(config.hero.life).toBe(HERO_LIFE)
      expect(config.hero.attack).toBe(HERO_ATTACK)
      expect(config.hero.spawnStartTick).toBe(HERO_SPAWN_START_TICK)
      expect(config.hero.spawnInterval).toBe(HERO_SPAWN_INTERVAL)
      expect(config.hero.announceTicks).toBe(HERO_ANNOUNCE_TICKS)
      expect(config.hero.nutrientDrop).toBe(HERO_NUTRIENT_DROP)
    })

    it('should match constants.ts nijirigoke config', () => {
      const config = createDefaultConfig()
      const niji = config.monsters.nijirigoke
      expect(niji.type).toBe('nijirigoke')
      expect(niji.pattern).toBe(MONSTER_CONFIGS.nijirigoke.pattern)
      expect(niji.life).toBe(MONSTER_CONFIGS.nijirigoke.life)
      expect(niji.attack).toBe(MONSTER_CONFIGS.nijirigoke.attack)
      expect(niji.predationTargets).toEqual([...MONSTER_CONFIGS.nijirigoke.predationTargets])
      expect(niji.canCarryNutrients).toBe(MONSTER_CONFIGS.nijirigoke.canCarryNutrients)
      expect(niji.budNutrientThreshold).toBe(BUD_NUTRIENT_THRESHOLD)
      expect(niji.budLifeThreshold).toBe(BUD_LIFE_THRESHOLD)
      expect(niji.flowerNutrientThreshold).toBe(FLOWER_NUTRIENT_THRESHOLD)
      expect(niji.moyomoyoDamage).toBe(MOYOMOYO_DAMAGE)
    })

    it('should match constants.ts gajigajimushi config', () => {
      const config = createDefaultConfig()
      const gaji = config.monsters.gajigajimushi
      expect(gaji.type).toBe('gajigajimushi')
      expect(gaji.pattern).toBe(MONSTER_CONFIGS.gajigajimushi.pattern)
      expect(gaji.life).toBe(MONSTER_CONFIGS.gajigajimushi.life)
      expect(gaji.attack).toBe(MONSTER_CONFIGS.gajigajimushi.attack)
      expect(gaji.predationTargets).toEqual([...MONSTER_CONFIGS.gajigajimushi.predationTargets])
      expect(gaji.canCarryNutrients).toBe(MONSTER_CONFIGS.gajigajimushi.canCarryNutrients)
      expect(gaji.pupaNutrientThreshold).toBe(PUPA_NUTRIENT_THRESHOLD)
      expect(gaji.pupaDuration).toBe(PUPA_DURATION)
      expect(gaji.reproLifeThreshold).toBe(GAJI_REPRO_LIFE_THRESHOLD)
      expect(gaji.reproLifeCost).toBe(GAJI_REPRO_LIFE_COST)
    })

    it('should match constants.ts lizardman config', () => {
      const config = createDefaultConfig()
      const liz = config.monsters.lizardman
      expect(liz.type).toBe('lizardman')
      expect(liz.pattern).toBe(MONSTER_CONFIGS.lizardman.pattern)
      expect(liz.life).toBe(MONSTER_CONFIGS.lizardman.life)
      expect(liz.attack).toBe(MONSTER_CONFIGS.lizardman.attack)
      expect(liz.predationTargets).toEqual([...MONSTER_CONFIGS.lizardman.predationTargets])
      expect(liz.canCarryNutrients).toBe(MONSTER_CONFIGS.lizardman.canCarryNutrients)
      expect(liz.layingNutrientThreshold).toBe(LAYING_NUTRIENT_THRESHOLD)
      expect(liz.layingLifeThreshold).toBe(LAYING_LIFE_THRESHOLD)
      expect(liz.layingDuration).toBe(LAYING_DURATION)
      expect(liz.eggHatchDuration).toBe(EGG_HATCH_DURATION)
      expect(liz.nestNutrientCost).toBe(NEST_NUTRIENT_COST)
      expect(liz.nestLifeCost).toBe(NEST_LIFE_COST)
    })
  })

  describe('validateConfig', () => {
    it('should return no errors for default config', () => {
      const config = createDefaultConfig()
      const errors = validateConfig(config)
      expect(errors).toEqual([])
    })

    it('should detect non-positive grid dimensions', () => {
      const config = createDefaultConfig()
      config.grid.defaultWidth = 0
      config.grid.defaultHeight = -1
      const errors = validateConfig(config)
      expect(errors).toContainEqual({ path: 'grid.defaultWidth', message: 'must be positive' })
      expect(errors).toContainEqual({ path: 'grid.defaultHeight', message: 'must be positive' })
    })

    it('should detect non-positive monster life', () => {
      const config = createDefaultConfig()
      config.monsters.nijirigoke.life = 0
      const errors = validateConfig(config)
      expect(errors).toContainEqual({ path: 'monsters.nijirigoke.life', message: 'must be positive' })
    })

    it('should detect negative monster attack', () => {
      const config = createDefaultConfig()
      config.monsters.nijirigoke.attack = -1
      const errors = validateConfig(config)
      expect(errors).toContainEqual({ path: 'monsters.nijirigoke.attack', message: 'must be non-negative' })
    })

    it('should allow zero monster attack', () => {
      const config = createDefaultConfig()
      // nijirigoke has attack 0 by default
      const errors = validateConfig(config)
      expect(errors.filter(e => e.path === 'monsters.nijirigoke.attack')).toEqual([])
    })

    it('should detect unknown predation target references', () => {
      const config = createDefaultConfig()
      config.monsters.nijirigoke.predationTargets = ['unknown_monster']
      const errors = validateConfig(config)
      expect(errors).toContainEqual({
        path: 'monsters.nijirigoke.predationTargets',
        message: 'references unknown type "unknown_monster"',
      })
    })

    it('should detect unknown spawn threshold type references', () => {
      const config = createDefaultConfig()
      config.spawn.thresholds.push({ type: 'nonexistent', minNutrient: 5 })
      const errors = validateConfig(config)
      expect(errors).toContainEqual({
        path: 'spawn.thresholds[2].type',
        message: 'references unknown type "nonexistent"',
      })
    })

    it('should detect non-positive hero values', () => {
      const config = createDefaultConfig()
      config.hero.life = 0
      config.hero.attack = -1
      const errors = validateConfig(config)
      expect(errors).toContainEqual({ path: 'hero.life', message: 'must be positive' })
      expect(errors).toContainEqual({ path: 'hero.attack', message: 'must be positive' })
    })

    it('should detect invalid hunger threshold ratio', () => {
      const config = createDefaultConfig()
      config.nutrient.hungerThresholdRatio = 0
      let errors = validateConfig(config)
      expect(errors).toContainEqual({
        path: 'nutrient.hungerThresholdRatio',
        message: 'must be between 0 (exclusive) and 1 (inclusive)',
      })

      config.nutrient.hungerThresholdRatio = 1.5
      errors = validateConfig(config)
      expect(errors).toContainEqual({
        path: 'nutrient.hungerThresholdRatio',
        message: 'must be between 0 (exclusive) and 1 (inclusive)',
      })
    })
  })

  describe('JSON serialization round-trip', () => {
    it('should survive JSON.parse(JSON.stringify()) without data loss', () => {
      const config = createDefaultConfig()
      const roundTripped: GameConfig = JSON.parse(JSON.stringify(config))
      expect(roundTripped).toEqual(config)
    })

    it('should produce a valid config after round-trip', () => {
      const config = createDefaultConfig()
      const roundTripped: GameConfig = JSON.parse(JSON.stringify(config))
      const errors = validateConfig(roundTripped)
      expect(errors).toEqual([])
    })
  })
})
