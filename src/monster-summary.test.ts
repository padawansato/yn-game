import { describe, it, expect } from 'vitest'
import { computeMonsterSummary } from './monster-summary'
import type { Monster, MonsterType } from './core/types'

function makeMonster(type: MonsterType, life: number, carrying: number, id = 'm-x'): Monster {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    direction: 'up',
    pattern: 'straight',
    phase: 'mobile',
    phaseTickCounter: 0,
    life,
    maxLife: 30,
    attack: 0,
    predationTargets: [],
    carryingNutrient: carrying,
    nestPosition: null,
    nestOrientation: null,
  }
}

describe('computeMonsterSummary', () => {
  it('returns empty object for no monsters', () => {
    expect(computeMonsterSummary([])).toEqual({})
  })

  it('aggregates count, totalLife, totalCarrying per type', () => {
    const monsters: Monster[] = [
      makeMonster('nijirigoke', 24, 5, 'n-1'),
      makeMonster('nijirigoke', 18, 3, 'n-2'),
      makeMonster('gajigajimushi', 30, 0, 'g-1'),
    ]
    const summary = computeMonsterSummary(monsters)
    expect(summary.nijirigoke).toEqual({ count: 2, totalLife: 42, totalCarrying: 8 })
    expect(summary.gajigajimushi).toEqual({ count: 1, totalLife: 30, totalCarrying: 0 })
  })

  it('does not include types with zero monsters', () => {
    const monsters: Monster[] = [makeMonster('lizardman', 100, 0, 'l-1')]
    const summary = computeMonsterSummary(monsters)
    expect(summary.lizardman).toBeDefined()
    expect(summary.nijirigoke).toBeUndefined()
    expect(summary.gajigajimushi).toBeUndefined()
  })
})
