import type { Cell, GameState, Monster, Position } from './types'
import type { GameConfig } from './config'

/**
 * Generate exponentially distributed random value
 * Most values will be low, few will be high
 */
export function exponentialRandom(scale: number = 1, randomFn: () => number = Math.random): number {
  const u = randomFn()
  return -Math.log(Math.max(1e-10, 1 - u)) * scale
}

/**
 * Initialize nutrients distributed across soil cells with sparse exponential distribution
 */
export function initializeNutrients(
  grid: Cell[][],
  totalAmount: number,
  config: GameConfig,
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
    return Math.min(config.grid.maxNutrientPerCell, Math.max(0, normalized))
  })

  let currentTotal = normalizedValues.reduce((sum, v) => sum + v, 0)
  let diff = totalAmount - currentTotal

  while (diff !== 0) {
    for (let i = 0; i < normalizedValues.length && diff !== 0; i++) {
      if (diff > 0 && normalizedValues[i] < config.grid.maxNutrientPerCell) {
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
      nutrientAmount: 0,
      magicAmount: cell.magicAmount ?? 0,
    }))
  )

  soilCells.forEach((pos, index) => {
    newGrid[pos.y][pos.x].nutrientAmount = normalizedValues[index]
  })

  return { grid: newGrid }
}

/**
 * Get adjacent soil cells to a position (4 directions: up/down/left/right)
 */
export function getAdjacentSoilCells(position: Position, grid: Cell[][]): Position[] {
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 }, // right
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
 * Get adjacent non-wall cells to a position (4 directions: up/down/left/right)
 * Used as fallback when no adjacent soil cells exist
 */
function getAdjacentNonWallCells(position: Position, grid: Cell[][]): Position[] {
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 }, // right
  ]

  const cells: Position[] = []

  for (const dir of directions) {
    const newX = position.x + dir.x
    const newY = position.y + dir.y

    if (newY >= 0 && newY < grid.length && newX >= 0 && newX < grid[0].length) {
      if (grid[newY][newX].type !== 'wall') {
        cells.push({ x: newX, y: newY })
      }
    }
  }

  return cells
}

/**
 * Get surrounding 9 cells (8 adjacent + center) that are not walls
 * Used for nutrient release on death (conservation law)
 */
export function getSurroundingCells(position: Position, grid: Cell[][]): Position[] {
  const offsets = [
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
  ]

  const cells: Position[] = []

  for (const offset of offsets) {
    const newX = position.x + offset.x
    const newY = position.y + offset.y

    if (newY >= 0 && newY < grid.length && newX >= 0 && newX < grid[0].length) {
      if (grid[newY][newX].type !== 'wall') {
        cells.push({ x: newX, y: newY })
      }
    }
  }

  return cells
}

/**
 * Nijirigoke absorbs nutrients from adjacent soil
 * Returns updated monster and grid
 */
export function absorbNutrient(
  monster: Monster,
  grid: Cell[][],
  config: GameConfig
): { monster: Monster; grid: Cell[][] } {
  if (monster.type !== 'nijirigoke') {
    return { monster, grid }
  }

  // Bud phase: absorb from surrounding 9 cells (soil and empty)
  if (monster.phase === 'bud') {
    return absorbNutrientWideRange(monster, grid, config)
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
  const canAbsorb = config.nutrient.carryCapacity - monster.carryingNutrient
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
 * Nijirigoke releases nutrients to adjacent cells
 * Prefers soil cells, falls back to empty cells
 * Releases until carryingNutrient = 1
 */
export function releaseNutrient(
  monster: Monster,
  grid: Cell[][],
  config: GameConfig
): { monster: Monster; grid: Cell[][] } {
  if (monster.type !== 'nijirigoke') {
    return { monster, grid }
  }

  if (monster.carryingNutrient < config.nutrient.releaseThreshold) {
    return { monster, grid }
  }

  // Try soil cells first, fall back to any non-wall adjacent cells
  const adjacentSoil = getAdjacentSoilCells(monster.position, grid)
  const adjacentNonWall =
    adjacentSoil.length > 0 ? adjacentSoil : getAdjacentNonWallCells(monster.position, grid)

  if (adjacentNonWall.length === 0) {
    return { monster, grid }
  }

  // Prefer facing direction for release target
  const directionOffset = getDirectionOffset(monster.direction)
  const facingPos = {
    x: monster.position.x + directionOffset.x,
    y: monster.position.y + directionOffset.y,
  }
  const targetCell =
    adjacentNonWall.find((s) => s.x === facingPos.x && s.y === facingPos.y) ?? adjacentNonWall[0]
  const toRelease = monster.carryingNutrient - 1

  const newGrid = grid.map((row, y) =>
    row.map((cell, x) => {
      if (x === targetCell.x && y === targetCell.y) {
        // Conservation law takes priority over MAX_NUTRIENT_PER_CELL cap
        return { ...cell, nutrientAmount: cell.nutrientAmount + toRelease }
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
 * Release nutrients when monster dies to surrounding 9 cells (8 adjacent + center)
 * Distributes to soil and empty cells (not walls)
 * If no valid cells, nutrients are lost
 */
export function releaseNutrientsOnDeath(monster: Monster, grid: Cell[][]): Cell[][] {
  if (monster.carryingNutrient <= 0) {
    return grid
  }

  const surroundingCells = getSurroundingCells(monster.position, grid)
  if (surroundingCells.length === 0) {
    return grid
  }

  // Distribute evenly among surrounding non-wall cells
  // Conservation law takes priority over MAX_NUTRIENT_PER_CELL cap
  const perCell = Math.floor(monster.carryingNutrient / surroundingCells.length)
  let remainder = monster.carryingNutrient % surroundingCells.length

  const newGrid = grid.map((row, y) =>
    row.map((cell, x) => {
      const match = surroundingCells.find((s) => s.x === x && s.y === y)
      if (match) {
        const extra = remainder > 0 ? 1 : 0
        if (remainder > 0) remainder--
        return { ...cell, nutrientAmount: cell.nutrientAmount + perCell + extra }
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
/**
 * Bud phase: absorb nutrients from surrounding 9 cells (wide range)
 */
function absorbNutrientWideRange(
  monster: Monster,
  grid: Cell[][],
  config: GameConfig
): { monster: Monster; grid: Cell[][] } {
  const surroundingCells = getSurroundingCells(monster.position, grid)
  const canAbsorb = config.nutrient.carryCapacity - monster.carryingNutrient
  if (canAbsorb <= 0) {
    return { monster, grid }
  }

  let totalAbsorbed = 0
  let newGrid = grid

  for (const cell of surroundingCells) {
    if (totalAbsorbed >= canAbsorb) break
    const cellNutrients = newGrid[cell.y][cell.x].nutrientAmount
    if (cellNutrients <= 0) continue

    const toAbsorb = Math.min(cellNutrients, canAbsorb - totalAbsorbed)
    totalAbsorbed += toAbsorb

    newGrid = newGrid.map((row, y) =>
      row.map((c, x) => {
        if (x === cell.x && y === cell.y) {
          return { ...c, nutrientAmount: c.nutrientAmount - toAbsorb }
        }
        return c
      })
    )
  }

  if (totalAbsorbed === 0) {
    return { monster, grid }
  }

  return {
    monster: { ...monster, carryingNutrient: monster.carryingNutrient + totalAbsorbed },
    grid: newGrid,
  }
}

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
