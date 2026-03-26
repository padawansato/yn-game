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
} from './constants'

describe('Constants', () => {
  describe('MONSTER_CONFIGS', () => {
    it('Nijirigoke should have straight pattern and life=16', () => {
      const config = MONSTER_CONFIGS.nijirigoke
      expect(config.pattern).toBe('straight')
      expect(config.life).toBe(16)
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

    it('Lizardman should have stationary pattern and life=80', () => {
      const config = MONSTER_CONFIGS.lizardman
      expect(config.pattern).toBe('stationary')
      expect(config.life).toBe(80)
      expect(config.attack).toBe(8)
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
})
