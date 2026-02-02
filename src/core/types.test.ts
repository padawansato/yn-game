import { describe, it, expect } from 'vitest'
import type { Monster, Position } from './types'

describe('Types', () => {
  it('should create a valid Position', () => {
    const pos: Position = { x: 0, y: 0 }
    expect(pos.x).toBe(0)
    expect(pos.y).toBe(0)
  })

  it('should create a valid Monster', () => {
    const monster: Monster = {
      id: 'test-1',
      type: 'nijirigoke',
      position: { x: 5, y: 5 },
      direction: 'right',
      pattern: 'straight',
      life: 10,
      maxLife: 10,
      attack: 0,
      predationTargets: [],
      carryingNutrient: null,
      nestPosition: null,
    }

    expect(monster.type).toBe('nijirigoke')
    expect(monster.pattern).toBe('straight')
    expect(monster.life).toBe(10)
  })

  it('should validate hunger state', () => {
    const monster: Monster = {
      id: 'test-2',
      type: 'gajigajimushi',
      position: { x: 3, y: 3 },
      direction: 'up',
      pattern: 'refraction',
      life: 8, // Below 30% of maxLife (30)
      maxLife: 30,
      attack: 3,
      predationTargets: ['nijirigoke'],
      carryingNutrient: null,
      nestPosition: null,
    }

    const isHungry = monster.life < monster.maxLife * 0.3
    expect(isHungry).toBe(true)
  })
})
