import type { Cell, GameState, Monster, Nutrient, Position } from './types'
import { NUTRIENT_DEPLETION_RATIO } from './constants'

let nutrientIdCounter = 0

export function generateNutrientId(): string {
  return `nutrient-${++nutrientIdCounter}`
}

export function resetNutrientIdCounter(): void {
  nutrientIdCounter = 0
}

/**
 * Initialize nutrients distributed across soil cells
 */
export function initializeNutrients(
  grid: Cell[][],
  totalAmount: number
): { grid: Cell[][]; nutrients: Nutrient[] } {
  const soilCells: Position[] = []

  // Find all soil cells
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x].type === 'soil') {
        soilCells.push({ x, y })
      }
    }
  }

  if (soilCells.length === 0) {
    return { grid, nutrients: [] }
  }

  // Distribute nutrients evenly across soil cells
  const amountPerCell = Math.floor(totalAmount / soilCells.length)
  const remainder = totalAmount % soilCells.length

  const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))
  const nutrients: Nutrient[] = []

  soilCells.forEach((pos, index) => {
    const amount = amountPerCell + (index < remainder ? 1 : 0)
    if (amount > 0) {
      newGrid[pos.y][pos.x].nutrientAmount = amount
    }
  })

  return { grid: newGrid, nutrients }
}

/**
 * Deplete nutrients when digging (30% lost)
 * Returns the amount available for the spawned Nijirigoke
 */
export function depleteOnDig(nutrientAmount: number): number {
  const available = Math.floor(nutrientAmount * (1 - NUTRIENT_DEPLETION_RATIO))
  return available
}

/**
 * Nijirigoke picks up a nutrient
 */
export function pickupNutrient(
  monster: Monster,
  nutrient: Nutrient
): { monster: Monster; nutrient: Nutrient } {
  if (monster.carryingNutrient !== null) {
    return { monster, nutrient }
  }

  return {
    monster: { ...monster, carryingNutrient: nutrient.id },
    nutrient: { ...nutrient, carriedBy: monster.id },
  }
}

/**
 * Nijirigoke deposits a nutrient at its current position
 */
export function depositNutrient(
  monster: Monster,
  nutrients: Nutrient[]
): { monster: Monster; nutrients: Nutrient[] } {
  if (monster.carryingNutrient === null) {
    return { monster, nutrients }
  }

  const updatedNutrients = nutrients.map((n) =>
    n.id === monster.carryingNutrient
      ? { ...n, position: { ...monster.position }, carriedBy: null }
      : n
  )

  return {
    monster: { ...monster, carryingNutrient: null },
    nutrients: updatedNutrients,
  }
}

/**
 * Get total nutrients in the game (for world death check)
 */
export function getTotalNutrients(state: GameState): number {
  // Nutrients in soil cells
  let total = 0
  for (const row of state.grid) {
    for (const cell of row) {
      total += cell.nutrientAmount
    }
  }

  // Nutrients being carried or on ground
  for (const nutrient of state.nutrients) {
    total += nutrient.amount
  }

  return total
}

/**
 * Check if world is dying (nutrients below threshold)
 */
export function isWorldDying(state: GameState, threshold: number = 0.1): boolean {
  const current = getTotalNutrients(state)
  return current < state.totalInitialNutrients * threshold
}
