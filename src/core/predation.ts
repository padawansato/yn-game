import type { Cell, GameEvent, Monster, Position } from './types'
import { releaseNutrientsOnDeath } from './nutrient'

export interface PredationResult {
  predator: Monster
  prey: Monster
  events: GameEvent[]
}

/**
 * Check if predator can eat prey based on hierarchy
 */
export function canPredate(predator: Monster, prey: Monster): boolean {
  return predator.predationTargets.includes(prey.type)
}

/**
 * Check for predation when two monsters are at the same position
 */
export function checkSameCellPredation(
  monsters: Monster[],
  position: Position
): { predator: Monster; prey: Monster } | null {
  const atPosition = monsters.filter(
    (m) => m.position.x === position.x && m.position.y === position.y
  )

  if (atPosition.length < 2) return null

  // Find predator-prey pair
  for (const potential of atPosition) {
    for (const target of atPosition) {
      if (potential.id !== target.id && canPredate(potential, target)) {
        return { predator: potential, prey: target }
      }
    }
  }

  return null
}

/**
 * Apply predation: predator gains life, prey dies
 */
export function applyPredation(
  predator: Monster,
  prey: Monster
): PredationResult {
  const events: GameEvent[] = []

  // Life recovery (capped at maxLife)
  const newLife = Math.min(predator.maxLife, predator.life + prey.life)
  const updatedPredator: Monster = { ...predator, life: newLife }

  // Emit predation event
  events.push({
    type: 'PREDATION',
    predator: updatedPredator,
    prey,
    position: predator.position,
  })

  // Emit death event
  events.push({
    type: 'MONSTER_DIED',
    monster: prey,
    cause: 'predation',
  })

  return {
    predator: updatedPredator,
    prey,
    events,
  }
}

/**
 * Process all predation events for monsters at the same positions
 * Returns updated monster list, updated grid, and events
 */
export function processPredation(
  monsters: Monster[],
  grid: Cell[][]
): {
  monsters: Monster[]
  grid: Cell[][]
  events: GameEvent[]
} {
  const events: GameEvent[] = []
  const deadMonsterIds = new Set<string>()
  const updatedMonsters = new Map<string, Monster>()
  let currentGrid = grid

  // Find all unique positions with multiple monsters
  const positionMap = new Map<string, Monster[]>()
  for (const monster of monsters) {
    const key = `${monster.position.x},${monster.position.y}`
    const list = positionMap.get(key) || []
    list.push(monster)
    positionMap.set(key, list)
  }

  // Check each position for predation
  for (const [, monstersAtPos] of positionMap) {
    if (monstersAtPos.length < 2) continue

    // Find predator-prey pairs (handle multiple predations at same position)
    for (const potentialPredator of monstersAtPos) {
      if (deadMonsterIds.has(potentialPredator.id)) continue

      for (const potentialPrey of monstersAtPos) {
        if (potentialPrey.id === potentialPredator.id) continue
        if (deadMonsterIds.has(potentialPrey.id)) continue

        if (canPredate(potentialPredator, potentialPrey)) {
          const predator = updatedMonsters.get(potentialPredator.id) || potentialPredator
          const result = applyPredation(predator, potentialPrey)

          updatedMonsters.set(potentialPredator.id, result.predator)
          deadMonsterIds.add(potentialPrey.id)
          events.push(...result.events)

          // Release prey's nutrients to adjacent soil
          if (potentialPrey.carryingNutrient > 0) {
            currentGrid = releaseNutrientsOnDeath(potentialPrey, currentGrid)
          }
        }
      }
    }
  }

  // Build final monster list
  const finalMonsters = monsters
    .filter((m) => !deadMonsterIds.has(m.id))
    .map((m) => updatedMonsters.get(m.id) || m)

  return {
    monsters: finalMonsters,
    grid: currentGrid,
    events,
  }
}
