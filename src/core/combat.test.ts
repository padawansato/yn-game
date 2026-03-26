import { describe, it, expect } from 'vitest'
import { processCombat } from './combat'
import type { Cell, Monster } from './types'
import type { HeroEntity } from './hero/types'
import { HERO_NUTRIENT_DROP } from './constants'

// Helper: create empty grid
function createGrid(width: number, height: number): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({
      type: 'empty' as const,
      nutrientAmount: 0,
      magicAmount: 0,
    }))
  )
}

// Helper: create hero
function createHero(overrides: Partial<HeroEntity> = {}): HeroEntity {
  return {
    kind: 'hero',
    id: 'hero-1',
    position: { x: 2, y: 2 },
    direction: 'right',
    life: 50,
    maxLife: 50,
    attack: 5,
    attackPattern: 'slash',
    visitedCells: new Set<string>(),
    pathHistory: [],
    state: 'exploring',
    targetFound: false,
    ...overrides,
  }
}

// Helper: create monster
function createMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: 'monster-1',
    type: 'gajigajimushi',
    position: { x: 3, y: 2 },
    direction: 'left',
    pattern: 'refraction',
    phase: 'larva',
    phaseTickCounter: 0,
    life: 30,
    maxLife: 30,
    attack: 3,
    predationTargets: ['nijirigoke'],
    carryingNutrient: 0,
    nestPosition: null,
    nestOrientation: null,
    ...overrides,
  }
}

describe('processCombat', () => {
  it('hero attacks monster in front cell (one-sided)', () => {
    const grid = createGrid(5, 5)
    // Hero at (2,2) facing right, monster at (3,2) facing down (not facing hero)
    const hero = createHero({ direction: 'right', position: { x: 2, y: 2 } })
    const monster = createMonster({ direction: 'down', position: { x: 3, y: 2 } })

    const result = processCombat([hero], [monster], grid)

    expect(result.monsters[0].life).toBe(30 - 5) // hero.attack = 5
    expect(result.heroes[0].life).toBe(50) // hero not damaged
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'HERO_COMBAT', heroId: 'hero-1', monsterId: 'monster-1' })
    )
  })

  it('monster attacks hero in front cell (one-sided)', () => {
    const grid = createGrid(5, 5)
    // Monster at (3,2) facing left, hero at (2,2) facing up (not facing monster)
    const hero = createHero({ direction: 'up', position: { x: 2, y: 2 } })
    const monster = createMonster({ direction: 'left', position: { x: 3, y: 2 }, attack: 3 })

    const result = processCombat([hero], [monster], grid)

    expect(result.heroes[0].life).toBe(50 - 3) // monster.attack = 3
    expect(result.monsters[0].life).toBe(30) // monster not damaged
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'HERO_COMBAT', heroId: 'hero-1', monsterId: 'monster-1' })
    )
  })

  it('mutual attack when facing each other', () => {
    const grid = createGrid(5, 5)
    // Hero at (2,2) facing right, monster at (3,2) facing left
    const hero = createHero({ direction: 'right', position: { x: 2, y: 2 } })
    const monster = createMonster({ direction: 'left', position: { x: 3, y: 2 }, attack: 3 })

    const result = processCombat([hero], [monster], grid)

    expect(result.heroes[0].life).toBe(50 - 3)
    expect(result.monsters[0].life).toBe(30 - 5)
  })

  it('mutual kill (both die simultaneously)', () => {
    const grid = createGrid(5, 5)
    const hero = createHero({ direction: 'right', position: { x: 2, y: 2 }, life: 3, attack: 30 })
    const monster = createMonster({ direction: 'left', position: { x: 3, y: 2 }, life: 30, attack: 3 })

    const result = processCombat([hero], [monster], grid)

    expect(result.heroes[0].life).toBe(0)
    expect(result.heroes[0].state).toBe('dead')
    expect(result.monsters).toHaveLength(0) // dead monster removed
    expect(result.events).toContainEqual(expect.objectContaining({ type: 'HERO_DIED' }))
    expect(result.events).toContainEqual(
      expect.objectContaining({ type: 'MONSTER_DIED', cause: 'combat' })
    )
  })

  it('attack=0 monster deals no damage', () => {
    const grid = createGrid(5, 5)
    // Nijirigoke (attack=0) facing hero
    const hero = createHero({ direction: 'up', position: { x: 2, y: 2 } })
    const monster = createMonster({
      id: 'niji-1',
      type: 'nijirigoke',
      direction: 'left',
      position: { x: 3, y: 2 },
      attack: 0,
      pattern: 'straight',
      phase: 'mobile',
    })

    const result = processCombat([hero], [monster], grid)

    expect(result.heroes[0].life).toBe(50) // no damage
    // No HERO_COMBAT event when attack=0 and hero also not attacking
    expect(result.events).toHaveLength(0)
  })

  it('same cell does not trigger attack', () => {
    const grid = createGrid(5, 5)
    // Both on same cell, hero facing right, monster facing down
    const hero = createHero({ direction: 'right', position: { x: 2, y: 2 } })
    const monster = createMonster({ direction: 'down', position: { x: 2, y: 2 } })

    const result = processCombat([hero], [monster], grid)

    // Hero's front is (3,2), monster is at (2,2) → no attack from hero
    // Monster's front is (2,3), hero is at (2,2) → no attack from monster
    expect(result.heroes[0].life).toBe(50)
    expect(result.monsters[0].life).toBe(30)
    expect(result.events).toHaveLength(0)
  })

  it('multiple heroes attack same monster (cumulative damage)', () => {
    const grid = createGrid(5, 5)
    const hero1 = createHero({ id: 'hero-1', direction: 'right', position: { x: 2, y: 2 }, attack: 5 })
    const hero2 = createHero({ id: 'hero-2', direction: 'down', position: { x: 3, y: 1 }, attack: 5 })
    const monster = createMonster({ direction: 'up', position: { x: 3, y: 2 } })

    const result = processCombat([hero1, hero2], [monster], grid)

    // Both heroes attack monster: 5 + 5 = 10
    expect(result.monsters[0].life).toBe(30 - 10)
    expect(result.events.filter((e) => e.type === 'HERO_COMBAT')).toHaveLength(2)
  })

  it('monster death releases carryingNutrient to grid', () => {
    const grid = createGrid(5, 5)
    const hero = createHero({ direction: 'right', position: { x: 2, y: 2 }, attack: 50 })
    const monster = createMonster({
      direction: 'up',
      position: { x: 3, y: 2 },
      life: 10,
      carryingNutrient: 9,
    })

    const result = processCombat([hero], [monster], grid)

    expect(result.monsters).toHaveLength(0)
    // Nutrient should be distributed to surrounding cells
    let totalNutrient = 0
    for (const row of result.grid) {
      for (const cell of row) {
        totalNutrient += cell.nutrientAmount
      }
    }
    expect(totalNutrient).toBe(9) // all nutrients released
  })

  it('hero death adds HERO_NUTRIENT_DROP to surrounding cells', () => {
    const grid = createGrid(5, 5)
    const hero = createHero({ direction: 'up', position: { x: 2, y: 2 }, life: 3 })
    const monster = createMonster({ direction: 'left', position: { x: 3, y: 2 }, attack: 10 })

    const result = processCombat([hero], [monster], grid)

    expect(result.heroes[0].life).toBeLessThanOrEqual(0)
    expect(result.heroes[0].state).toBe('dead')

    // HERO_NUTRIENT_DROP nutrients added externally
    let totalNutrient = 0
    for (const row of result.grid) {
      for (const cell of row) {
        totalNutrient += cell.nutrientAmount
      }
    }
    expect(totalNutrient).toBe(HERO_NUTRIENT_DROP)
    expect(result.events).toContainEqual(expect.objectContaining({ type: 'HERO_DIED' }))
  })

  it('no target in front cell produces no events', () => {
    const grid = createGrid(5, 5)
    // Hero at (0,0) facing left → front cell is out of grid
    const hero = createHero({ direction: 'left', position: { x: 0, y: 0 } })
    const monster = createMonster({ direction: 'right', position: { x: 4, y: 4 } })

    const result = processCombat([hero], [monster], grid)

    expect(result.heroes[0].life).toBe(50)
    expect(result.monsters[0].life).toBe(30)
    expect(result.events).toHaveLength(0)
  })

  it('front cell outside grid boundary is ignored', () => {
    const grid = createGrid(5, 5)
    // Hero at (4,2) facing right → front cell (5,2) is outside grid
    const hero = createHero({ direction: 'right', position: { x: 4, y: 2 } })
    const monster = createMonster({ direction: 'left', position: { x: 0, y: 2 } })

    const result = processCombat([hero], [monster], grid)

    expect(result.events).toHaveLength(0)
  })
})
