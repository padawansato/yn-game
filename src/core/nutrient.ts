import type { Cell, GameState, Monster, Position } from './types'
import {
  NUTRIENT_DEPLETION_RATIO,
  NUTRIENT_CARRY_CAPACITY,
  NUTRIENT_RELEASE_THRESHOLD,
} from './constants'

/**
 * Generate exponentially distributed random value
 * Most values will be low, few will be high
 */
export function exponentialRandom(
  scale: number = 1,
  randomFn: () => number = Math.random
): number {
  const u = randomFn()
  return -Math.log(1 - u + 0.0001) * scale
}

/**
 * Initialize nutrients distributed across soil cells with sparse exponential distribution
 */
export function initializeNutrients(
  grid: Cell[][],
  totalAmount: number,
  randomFn: () => number = Math.random
): { grid: Cell[][] } {
  const soilCells: Position[] = []

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x].type === 'soil') {
        soilCells.push({ x, y })
      }
    }
  }

  if (soilCells.length === 0) {
    return { grid }
  }

  const scale = 30
  const rawValues = soilCells.map(() => exponentialRandom(scale, randomFn))
  const rawSum = rawValues.reduce((sum, v) => sum + v, 0)

  const normalizedValues = rawValues.map((raw) => {
    const normalized = Math.round((raw / rawSum) * totalAmount)
    return Math.min(100, Math.max(0, normalized))
  })

  let currentTotal = normalizedValues.reduce((sum, v) => sum + v, 0)
  let diff = totalAmount - currentTotal

  while (diff !== 0) {
    for (let i = 0; i < normalizedValues.length && diff !== 0; i++) {
      if (diff > 0 && normalizedValues[i] < 100) {
        normalizedValues[i]++
        diff--
      } else if (diff < 0 && normalizedValues[i] > 0) {
        normalizedValues[i]--
        diff++
      }
    }
    if (currentTotal === normalizedValues.reduce((sum, v) => sum + v, 0)) break
    currentTotal = normalizedValues.reduce((sum, v) => sum + v, 0)
  }

  const newGrid = grid.map((row) =>
    row.map((cell) => ({
      ...cell,
      nutrientAmount: cell.type === 'soil' ? 0 : 0,
    }))
  )

  soilCells.forEach((pos, index) => {
    newGrid[pos.y][pos.x].nutrientAmount = normalizedValues[index]
  })

  return { grid: newGrid }
}

/**
 * Deplete nutrients when digging (30% lost)
 */
export function depleteOnDig(nutrientAmount: number): number {
  return Math.floor(nutrientAmount * (1 - NUTRIENT_DEPLETION_RATIO))
}

/**
 * Get adjacent soil cells to a position
 */
export function getAdjacentSoilCells(position: Position, grid: Cell[][]): Position[] {
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 },  // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 },  // right
  ]

  const adjacentSoil: Position[] = []

  for (const dir of directions) {
    const newX = position.x + dir.x
    const newY = position.y + dir.y

    if (newY >= 0 && newY < grid.length && newX >= 0 && newX < grid[0].length) {
      if (grid[newY][newX].type === 'soil') {
        adjacentSoil.push({ x: newX, y: newY })
      }
    }
  }

  return adjacentSoil
}

/**
 * Nijirigoke absorbs nutrients from adjacent soil
 * Returns updated monster and grid
 */
export function absorbNutrient(
  monster: Monster,
  grid: Cell[][]
): { monster: Monster; grid: Cell[][] } {
  if (monster.type !== 'nijirigoke') {
    return { monster, grid }
  }

  const adjacentSoil = getAdjacentSoilCells(monster.position, grid)
  if (adjacentSoil.length === 0) {
    return { monster, grid }
  }

  // Find soil with nutrients (prefer facing direction)
  let targetSoil: Position | null = null
  const directionOffset = getDirectionOffset(monster.direction)
  const facingPos = {
    x: monster.position.x + directionOffset.x,
    y: monster.position.y + directionOffset.y,
  }

  // Check facing direction first
  for (const soil of adjacentSoil) {
    if (soil.x === facingPos.x && soil.y === facingPos.y) {
      if (grid[soil.y][soil.x].nutrientAmount > 0) {
        targetSoil = soil
        break
      }
    }
  }

  // If no nutrients in facing direction, check others
  if (!targetSoil) {
    for (const soil of adjacentSoil) {
      if (grid[soil.y][soil.x].nutrientAmount > 0) {
        targetSoil = soil
        break
      }
    }
  }

  if (!targetSoil) {
    return { monster, grid }
  }

  const soilNutrients = grid[targetSoil.y][targetSoil.x].nutrientAmount
  const canAbsorb = NUTRIENT_CARRY_CAPACITY - monster.carryingNutrient
  const toAbsorb = Math.min(soilNutrients, canAbsorb)

  if (toAbsorb <= 0) {
    return { monster, grid }
  }

  const newGrid = grid.map((row, y) =>
    row.map((cell, x) => {
      if (x === targetSoil!.x && y === targetSoil!.y) {
        return { ...cell, nutrientAmount: cell.nutrientAmount - toAbsorb }
      }
      return cell
    })
  )

  return {
    monster: { ...monster, carryingNutrient: monster.carryingNutrient + toAbsorb },
    grid: newGrid,
  }
}

/**
 * Nijirigoke releases nutrients to adjacent soil
 * Releases until carryingNutrient = 1
 */
export function releaseNutrient(
  monster: Monster,
  grid: Cell[][]
): { monster: Monster; grid: Cell[][] } {
  if (monster.type !== 'nijirigoke') {
    return { monster, grid }
  }

  if (monster.carryingNutrient < NUTRIENT_RELEASE_THRESHOLD) {
    return { monster, grid }
  }

  const adjacentSoil = getAdjacentSoilCells(monster.position, grid)
  if (adjacentSoil.length === 0) {
    return { monster, grid }
  }

  // Release to first adjacent soil, leaving 1 nutrient
  const targetSoil = adjacentSoil[0]
  const toRelease = monster.carryingNutrient - 1

  const newGrid = grid.map((row, y) =>
    row.map((cell, x) => {
      if (x === targetSoil.x && y === targetSoil.y) {
        return { ...cell, nutrientAmount: Math.min(100, cell.nutrientAmount + toRelease) }
      }
      return cell
    })
  )

  return {
    monster: { ...monster, carryingNutrient: 1 },
    grid: newGrid,
  }
}

/**
 * Release nutrients when monster dies to adjacent soil
 * If no adjacent soil, nutrients are lost
 */
export function releaseNutrientsOnDeath(
  monster: Monster,
  grid: Cell[][]
): Cell[][] {
  if (monster.carryingNutrient <= 0) {
    return grid
  }

  const adjacentSoil = getAdjacentSoilCells(monster.position, grid)
  if (adjacentSoil.length === 0) {
    // Nutrients lost (entropy)
    return grid
  }

  // Distribute evenly among adjacent soil
  const perCell = Math.floor(monster.carryingNutrient / adjacentSoil.length)
  let remainder = monster.carryingNutrient % adjacentSoil.length

  const newGrid = grid.map((row, y) =>
    row.map((cell, x) => {
      const match = adjacentSoil.find((s) => s.x === x && s.y === y)
      if (match) {
        const extra = remainder > 0 ? 1 : 0
        if (remainder > 0) remainder--
        return { ...cell, nutrientAmount: Math.min(100, cell.nutrientAmount + perCell + extra) }
      }
      return cell
    })
  )

  return newGrid
}

/**
 * Get total nutrients in the game
 */
export function getTotalNutrients(state: GameState): number {
  let total = 0

  // Nutrients in soil cells
  for (const row of state.grid) {
    for (const cell of row) {
      total += cell.nutrientAmount
    }
  }

  // Nutrients carried by monsters
  for (const monster of state.monsters) {
    total += monster.carryingNutrient
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

/**
 * Helper: get direction offset
 */
function getDirectionOffset(direction: Monster['direction']): { x: number; y: number } {
  switch (direction) {
    case 'up':
      return { x: 0, y: -1 }
    case 'down':
      return { x: 0, y: 1 }
    case 'left':
      return { x: -1, y: 0 }
    case 'right':
      return { x: 1, y: 0 }
  }
}
