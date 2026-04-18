import { describe, it, expect } from 'vitest'
import {
  MONSTER_CONFIGS,
  HUNGER_THRESHOLD_RATIO,
  HERO_LIFE,
  HERO_ATTACK,
  HERO_SPAWN_START_TICK,
  HERO_SPAWN_INTERVAL,
  HERO_ANNOUNCE_TICKS,
  HERO_NUTRIENT_DROP,
  GRID_PRESETS,
  DEFAULT_GRID_WIDTH,
  DEFAULT_GRID_HEIGHT,
} from './constants'

describe('Constants', () => {
  describe('MONSTER_CONFIGS', () => {
    it('Nijirigoke should have straight pattern and life=24', () => {
      const config = MONSTER_CONFIGS.nijirigoke
      expect(config.pattern).toBe('straight')
      expect(config.life).toBe(24)
      expect(config.canCarryNutrients).toBe(true)
      expect(config.predationTargets).toEqual([])
    })

    it('Gajigajimushi should have refraction pattern and life=30', () => {
      const config = MONSTER_CONFIGS.gajigajimushi
      expect(config.pattern).toBe('refraction')
      expect(config.life).toBe(30)
      expect(config.attack).toBe(3)
      expect(config.predationTargets).toEqual(['nijirigoke'])
    })

    it('Lizardman should have stationary pattern and life=120', () => {
      const config = MONSTER_CONFIGS.lizardman
      expect(config.pattern).toBe('stationary')
      expect(config.life).toBe(120)
      expect(config.attack).toBe(15)
      expect(config.predationTargets).toEqual(['nijirigoke', 'gajigajimushi'])
    })
  })

  describe('Game parameters', () => {
    it('should have hunger threshold ratio of 0.3', () => {
      expect(HUNGER_THRESHOLD_RATIO).toBe(0.3)
    })
  })

  describe('Hero constants', () => {
    it('should have hero base stats', () => {
      expect(HERO_LIFE).toBe(50)
      expect(HERO_ATTACK).toBe(5)
    })

    it('should have hero spawn timing', () => {
      expect(HERO_SPAWN_START_TICK).toBe(100)
      expect(HERO_SPAWN_INTERVAL).toBe(10)
      expect(HERO_ANNOUNCE_TICKS).toBe(20)
    })

    it('should have hero nutrient drop', () => {
      expect(HERO_NUTRIENT_DROP).toBe(15)
    })
  })

  describe('GRID_PRESETS', () => {
    it('should contain small and large presets', () => {
      expect(GRID_PRESETS.small).toEqual({ width: 10, height: 8 })
      expect(GRID_PRESETS.large).toEqual({ width: 30, height: 40 })
    })

    it('should have positive integer dimensions for all presets', () => {
      for (const [key, preset] of Object.entries(GRID_PRESETS)) {
        expect(preset.width, `${key}.width`).toBeGreaterThan(0)
        expect(preset.height, `${key}.height`).toBeGreaterThan(0)
        expect(Number.isInteger(preset.width), `${key}.width is integer`).toBe(true)
        expect(Number.isInteger(preset.height), `${key}.height is integer`).toBe(true)
      }
    })

    it('DEFAULT_GRID_WIDTH should derive from small preset', () => {
      expect(DEFAULT_GRID_WIDTH).toBe(GRID_PRESETS.small.width)
    })

    it('DEFAULT_GRID_HEIGHT should derive from small preset', () => {
      expect(DEFAULT_GRID_HEIGHT).toBe(GRID_PRESETS.small.height)
    })
  })
})
