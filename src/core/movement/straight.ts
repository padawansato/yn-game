import type { Cell, Direction, Monster, Nutrient, Position } from '../types'

/**
 * Get the position in front of the monster
 */
export function getForwardPosition(position: Position, direction: Direction): Position {
  switch (direction) {
    case 'up':
      return { x: position.x, y: position.y - 1 }
    case 'down':
      return { x: position.x, y: position.y + 1 }
    case 'left':
      return { x: position.x - 1, y: position.y }
    case 'right':
      return { x: position.x + 1, y: position.y }
  }
}

/**
 * Check if a position is valid and not a wall
 */
export function isValidMove(position: Position, grid: Cell[][]): boolean {
  if (position.y < 0 || position.y >= grid.length) return false
  if (position.x < 0 || position.x >= grid[0].length) return false
  return grid[position.y][position.x].type !== 'wall'
}

/**
 * Get turn directions relative to current direction
 */
export function getTurnDirections(
  direction: Direction
): { left: Direction; right: Direction; back: Direction } {
  const turns: Record<Direction, { left: Direction; right: Direction; back: Direction }> = {
    up: { left: 'left', right: 'right', back: 'down' },
    down: { left: 'right', right: 'left', back: 'up' },
    left: { left: 'down', right: 'up', back: 'right' },
    right: { left: 'up', right: 'down', back: 'left' },
  }
  return turns[direction]
}

/**
 * Handle wall collision - randomly choose right, left, or back
 */
export function handleWallCollision(
  monster: Monster,
  grid: Cell[][],
  randomFn: () => number = Math.random
): Direction {
  const turns = getTurnDirections(monster.direction)
  const options: Direction[] = []

  // Check which directions are available
  const leftPos = getForwardPosition(monster.position, turns.left)
  const rightPos = getForwardPosition(monster.position, turns.right)
  const backPos = getForwardPosition(monster.position, turns.back)

  if (isValidMove(leftPos, grid)) options.push(turns.left)
  if (isValidMove(rightPos, grid)) options.push(turns.right)
  if (isValidMove(backPos, grid)) options.push(turns.back)

  // If no options available, keep current direction (stuck)
  if (options.length === 0) return monster.direction

  // Random choice among available options
  const index = Math.floor(randomFn() * options.length)
  return options[index]
}

/**
 * Find nutrient at position
 */
export function findNutrientAtPosition(
  position: Position,
  nutrients: Nutrient[]
): Nutrient | undefined {
  return nutrients.find(
    (n) => n.position.x === position.x && n.position.y === position.y && n.carriedBy === null
  )
}

/**
 * Calculate next move for straight pattern (Nijirigoke)
 * Returns new position and direction, plus nutrient interaction result
 */
export function calculateStraightMove(
  monster: Monster,
  grid: Cell[][],
  nutrients: Nutrient[],
  randomFn: () => number = Math.random
): {
  position: Position
  direction: Direction
  nutrientInteraction: 'pickup' | 'deposit' | null
  nutrientId: string | null
} {
  const forwardPos = getForwardPosition(monster.position, monster.direction)

  // Check if forward is blocked
  if (!isValidMove(forwardPos, grid)) {
    // Wall collision - turn
    const newDirection = handleWallCollision(monster, grid, randomFn)
    return {
      position: monster.position, // Stay in place this tick
      direction: newDirection,
      nutrientInteraction: null,
      nutrientId: null,
    }
  }

  // Check for nutrient interaction at new position
  let nutrientInteraction: 'pickup' | 'deposit' | null = null
  let nutrientId: string | null = null

  if (monster.type === 'nijirigoke') {
    const nutrientAtTarget = findNutrientAtPosition(forwardPos, nutrients)

    if (monster.carryingNutrient === null && nutrientAtTarget) {
      // Pick up nutrient
      nutrientInteraction = 'pickup'
      nutrientId = nutrientAtTarget.id
    } else if (monster.carryingNutrient !== null && !nutrientAtTarget) {
      // Deposit nutrient (only if no nutrient already there)
      nutrientInteraction = 'deposit'
      nutrientId = monster.carryingNutrient
    }
  }

  return {
    position: forwardPos,
    direction: monster.direction,
    nutrientInteraction,
    nutrientId,
  }
}
