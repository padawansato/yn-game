import type { Cell, Direction, Monster, Position } from '../types'
import { getForwardPosition, getTurnDirections, isValidMove } from './straight'
import { isHungry } from './hunger'

/**
 * Check if position is adjacent to nest (including diagonal)
 */
export function isAdjacentToNest(position: Position, nestPosition: Position): boolean {
  const dx = Math.abs(position.x - nestPosition.x)
  const dy = Math.abs(position.y - nestPosition.y)
  return dx <= 1 && dy <= 1 && (dx > 0 || dy > 0)
}

/**
 * Get all adjacent positions to nest that are valid moves
 */
export function getPatrolPositions(nestPosition: Position, grid: Cell[][]): Position[] {
  const positions: Position[] = []

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue
      const pos = { x: nestPosition.x + dx, y: nestPosition.y + dy }
      if (isValidMove(pos, grid)) {
        positions.push(pos)
      }
    }
  }

  return positions
}

/**
 * Check if a 2x3 or 3x2 contiguous open space exists containing the position
 */
export function has2x3Space(position: Position, grid: Cell[][]): boolean {
  // Check all possible 2x3 and 3x2 rectangles that include the position
  const patterns = [
    // 2x3 (width=3, height=2) patterns - position can be at any of the 6 cells
    { offsets: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }] },
    { offsets: [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
    { offsets: [{ x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: -2, y: 1 }, { x: -1, y: 1 }, { x: 0, y: 1 }] },
    { offsets: [{ x: 0, y: -1 }, { x: 1, y: -1 }, { x: 2, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }] },
    { offsets: [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }] },
    { offsets: [{ x: -2, y: -1 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }] },
    // 3x2 (width=2, height=3) patterns - position can be at any of the 6 cells
    { offsets: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] },
    { offsets: [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 2 }, { x: 0, y: 2 }] },
    { offsets: [{ x: 0, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }] },
    { offsets: [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }] },
    { offsets: [{ x: 0, y: -2 }, { x: 1, y: -2 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }] },
    { offsets: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }] },
  ]

  for (const pattern of patterns) {
    const allOpen = pattern.offsets.every((offset) => {
      const pos = { x: position.x + offset.x, y: position.y + offset.y }
      return isValidMove(pos, grid)
    })
    if (allOpen) return true
  }

  return false
}

/**
 * Check if a position has enough open area for a nest (2x3 or 3x2 contiguous space)
 */
export function canEstablishNest(position: Position, grid: Cell[][]): boolean {
  return has2x3Space(position, grid)
}

/**
 * Get all valid adjacent positions (4 directions: up, down, left, right)
 */
export function getAdjacentPositions(position: Position, grid: Cell[][]): Position[] {
  const positions: Position[] = []
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 }, // right
  ]

  for (const dir of directions) {
    const pos = { x: position.x + dir.x, y: position.y + dir.y }
    if (isValidMove(pos, grid)) {
      positions.push(pos)
    }
  }

  return positions
}

/**
 * Check if a position is within patrol range of the nest (within 2 cells)
 */
export function isWithinPatrolRange(position: Position, nestPosition: Position): boolean {
  const dx = Math.abs(position.x - nestPosition.x)
  const dy = Math.abs(position.y - nestPosition.y)
  return dx <= 2 && dy <= 2
}

/**
 * Calculate direction toward target position
 */
export function getDirectionToward(from: Position, to: Position): Direction {
  const dx = to.x - from.x
  const dy = to.y - from.y

  // Prioritize larger difference
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? 'right' : 'left'
  } else {
    return dy > 0 ? 'down' : 'up'
  }
}

/**
 * Find prey direction from current position
 */
function findPreyDirection(
  monster: Monster,
  monsters: Monster[],
  grid: Cell[][]
): Direction | null {
  if (!isHungry(monster) || monster.predationTargets.length === 0) {
    return null
  }

  const directions: Direction[] = ['up', 'down', 'left', 'right']
  let closestDirection: Direction | null = null
  let closestDistance = Infinity

  for (const dir of directions) {
    let pos = monster.position

    // Scan up to 5 cells in each direction
    for (let i = 0; i < 5; i++) {
      pos = getForwardPosition(pos, dir)
      if (!isValidMove(pos, grid)) break

      const preyAtPos = monsters.find(
        (m) =>
          m.id !== monster.id &&
          m.position.x === pos.x &&
          m.position.y === pos.y &&
          monster.predationTargets.includes(m.type)
      )

      if (preyAtPos) {
        const distance = i + 1
        if (distance < closestDistance) {
          closestDistance = distance
          closestDirection = dir
        }
        break
      }
    }
  }

  return closestDirection
}

/**
 * Calculate next move for stationary pattern (Lizardman)
 * Establishes nest in open area and patrols around it by moving one cell at a time.
 * Falls back to straight movement if no nest.
 * When hungry, prioritizes moving toward prey within patrol range.
 */
export function calculateStationaryMove(
  monster: Monster,
  grid: Cell[][],
  monsters: Monster[] = [],
  randomFn: () => number = Math.random
): { position: Position; direction: Direction; nestPosition: Position | null } {
  // No nest yet - try to establish one
  if (monster.nestPosition === null) {
    if (canEstablishNest(monster.position, grid)) {
      // Establish nest at current position, stay in place this turn
      return {
        position: monster.position,
        direction: monster.direction,
        nestPosition: monster.position,
      }
    }

    // Cannot establish nest - use straight pattern fallback
    return straightFallback(monster, grid, randomFn)
  }

  // Has nest - patrol by moving one cell at a time within patrol range
  const adjacentPositions = getAdjacentPositions(monster.position, grid)
  const patrolOptions = adjacentPositions.filter((pos) =>
    isWithinPatrolRange(pos, monster.nestPosition!)
  )

  if (patrolOptions.length === 0) {
    // No valid patrol positions - stay in place
    return {
      position: monster.position,
      direction: monster.direction,
      nestPosition: monster.nestPosition,
    }
  }

  // When hungry, prioritize moving toward prey
  const preyDirection = findPreyDirection(monster, monsters, grid)
  if (preyDirection) {
    // Filter patrol options that move toward prey
    const preyOptions = patrolOptions.filter((pos) => {
      const moveDir = getDirectionToward(monster.position, pos)
      return moveDir === preyDirection
    })

    if (preyOptions.length > 0) {
      const target = preyOptions[0]
      return {
        position: target,
        direction: preyDirection,
        nestPosition: monster.nestPosition,
      }
    }
  }

  // Move to a random adjacent position within patrol range
  const targetIdx = Math.floor(randomFn() * patrolOptions.length)
  const target = patrolOptions[targetIdx]
  const direction = getDirectionToward(monster.position, target)

  return {
    position: target,
    direction,
    nestPosition: monster.nestPosition,
  }
}

/**
 * Fallback to straight movement when no nest can be established
 */
function straightFallback(
  monster: Monster,
  grid: Cell[][],
  randomFn: () => number
): { position: Position; direction: Direction; nestPosition: null } {
  const forwardPos = getForwardPosition(monster.position, monster.direction)

  if (isValidMove(forwardPos, grid)) {
    return {
      position: forwardPos,
      direction: monster.direction,
      nestPosition: null,
    }
  }

  // Hit wall - turn randomly
  const turns = getTurnDirections(monster.direction)
  const options: Direction[] = []

  const leftPos = getForwardPosition(monster.position, turns.left)
  const rightPos = getForwardPosition(monster.position, turns.right)
  const backPos = getForwardPosition(monster.position, turns.back)

  if (isValidMove(leftPos, grid)) options.push(turns.left)
  if (isValidMove(rightPos, grid)) options.push(turns.right)
  if (isValidMove(backPos, grid)) options.push(turns.back)

  if (options.length === 0) {
    return {
      position: monster.position,
      direction: monster.direction,
      nestPosition: null,
    }
  }

  const idx = Math.floor(randomFn() * options.length)
  const newDir = options[idx]

  return {
    position: monster.position,
    direction: newDir,
    nestPosition: null,
  }
}
