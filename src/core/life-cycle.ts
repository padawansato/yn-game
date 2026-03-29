import {
  MOVEMENT_LIFE_COST,
  NEST_NUTRIENT_COST,
  NEST_LIFE_COST,
} from './constants'
import type {
  Cell,
  GameEvent,
  Monster,
  Position,
} from './types'
import {
  absorbNutrient,
  releaseNutrient,
  releaseNutrientsOnDeath,
} from './nutrient'

/**
 * Process nest establishment cost for lizardmen that just built a nest
 */
export function processNestEstablishment(
  monsters: Monster[],
  originalNestPositions: Map<string, Position | null>
): { monsters: Monster[]; events: GameEvent[] } {
  const events: GameEvent[] = []
  const updated = monsters.map(monster => {
    const originalNest = originalNestPositions.get(monster.id)
    if (originalNest === null && monster.nestPosition !== null) {
      // Nest newly established - deduct cost
      return {
        ...monster,
        carryingNutrient: monster.carryingNutrient - NEST_NUTRIENT_COST,
        life: monster.life - NEST_LIFE_COST,
      }
    }
    return monster
  })
  return { monsters: updated, events }
}

/**
 * Process nutrient absorption and release for all Nijirigoke
 */
export function processNutrientInteractions(
  monsters: Monster[],
  grid: Cell[][]
): { monsters: Monster[]; grid: Cell[][]; events: GameEvent[] } {
  const events: GameEvent[] = []
  let currentGrid = grid
  const updatedMonsters: Monster[] = []

  for (const monster of monsters) {
    if (monster.type !== 'nijirigoke') {
      updatedMonsters.push(monster)
      continue
    }

    // Try to absorb first
    const absorbResult = absorbNutrient(monster, currentGrid)
    if (absorbResult.monster.carryingNutrient > monster.carryingNutrient) {
      // Successfully absorbed
      const absorbed = absorbResult.monster.carryingNutrient - monster.carryingNutrient
      events.push({
        type: 'NUTRIENT_ABSORBED',
        monster: absorbResult.monster,
        amount: absorbed,
        fromPosition: monster.position,
      })
      currentGrid = absorbResult.grid
      updatedMonsters.push(absorbResult.monster)
      continue
    }

    // Try to release if not absorbed
    const releaseResult = releaseNutrient(monster, currentGrid)
    if (releaseResult.monster.carryingNutrient < monster.carryingNutrient) {
      // Successfully released
      const released = monster.carryingNutrient - releaseResult.monster.carryingNutrient
      events.push({
        type: 'NUTRIENT_RELEASED',
        monster: releaseResult.monster,
        amount: released,
        toPosition: monster.position,
      })
      currentGrid = releaseResult.grid
      updatedMonsters.push(releaseResult.monster)
      continue
    }

    // No interaction
    updatedMonsters.push(monster)
  }

  return { monsters: updatedMonsters, grid: currentGrid, events }
}

/**
 * Decrease life for all monsters that moved
 */
export function decreaseLifeForMoved(
  monsters: Monster[],
  originalPositions: Map<string, Position>,
  grid: Cell[][]
): { monsters: Monster[]; grid: Cell[][]; events: GameEvent[] } {
  const events: GameEvent[] = []
  let currentGrid = grid

  const updated = monsters
    .map((monster) => {
      const original = originalPositions.get(monster.id)
      if (!original) return monster

      // Check if actually moved
      const moved = original.x !== monster.position.x || original.y !== monster.position.y
      if (!moved) return monster

      if (monster.type === 'nijirigoke' && monster.carryingNutrient > 0) {
        // Deposit 1 nutrient to the cell monster moved from (conservation law)
        const orig = original
        currentGrid = currentGrid.map((row, y) =>
          row.map((c, x) => {
            if (x === orig.x && y === orig.y) {
              return { ...c, nutrientAmount: c.nutrientAmount + 1 }
            }
            return c
          })
        )
        return { ...monster, carryingNutrient: monster.carryingNutrient - 1 }
      }
      const newLife = monster.life - MOVEMENT_LIFE_COST
      if (newLife <= 0) {
        events.push({ type: 'MONSTER_DIED', monster, cause: 'starvation' })
        // Release nutrients on death
        currentGrid = releaseNutrientsOnDeath(monster, currentGrid)
        return null
      }

      return { ...monster, life: newLife }
    })
    .filter((m): m is Monster => m !== null)

  return { monsters: updated, grid: currentGrid, events }
}
