import { describe, it, expect } from 'vitest'
import type { HeroEntity, HeroSpawnConfig } from './types'

describe('Hero Types', () => {
  it('should create a valid HeroEntity', () => {
    const hero: HeroEntity = {
      kind: 'hero',
      id: 'hero-1',
      position: { x: 5, y: 0 },
      direction: 'down',
      life: 50,
      maxLife: 50,
      attack: 5,
      attackPattern: 'slash',
      visitedCells: new Set<string>(),
      pathHistory: [{ x: 5, y: 0 }],
      state: 'exploring',
      targetFound: false,
    }

    expect(hero.kind).toBe('hero')
    expect(hero.id).toBe('hero-1')
    expect(hero.position).toEqual({ x: 5, y: 0 })
    expect(hero.direction).toBe('down')
    expect(hero.life).toBe(50)
    expect(hero.maxLife).toBe(50)
    expect(hero.attack).toBe(5)
    expect(hero.attackPattern).toBe('slash')
    expect(hero.visitedCells).toBeInstanceOf(Set)
    expect(hero.visitedCells.size).toBe(0)
    expect(hero.pathHistory).toEqual([{ x: 5, y: 0 }])
    expect(hero.state).toBe('exploring')
    expect(hero.targetFound).toBe(false)
  })

  it('should support all HeroState values', () => {
    const states: HeroEntity['state'][] = ['exploring', 'returning', 'dead']
    expect(states).toHaveLength(3)
  })

  it('should track visited cells with Set', () => {
    const visited = new Set<string>()
    visited.add('5,0')
    visited.add('5,1')
    visited.add('5,0') // duplicate

    expect(visited.size).toBe(2)
    expect(visited.has('5,0')).toBe(true)
    expect(visited.has('5,1')).toBe(true)
  })

  it('should create a valid HeroSpawnConfig', () => {
    const config: HeroSpawnConfig = {
      partySize: 2,
      spawnStartTick: 100,
      spawnInterval: 10,
      heroesSpawned: 0,
    }

    expect(config.partySize).toBe(2)
    expect(config.spawnStartTick).toBe(100)
    expect(config.spawnInterval).toBe(10)
    expect(config.heroesSpawned).toBe(0)
  })

  it('should enforce partySize range conceptually (1-3)', () => {
    const config: HeroSpawnConfig = {
      partySize: 3,
      spawnStartTick: 100,
      spawnInterval: 10,
      heroesSpawned: 0,
    }

    expect(config.partySize).toBeGreaterThanOrEqual(1)
    expect(config.partySize).toBeLessThanOrEqual(3)
  })
})
