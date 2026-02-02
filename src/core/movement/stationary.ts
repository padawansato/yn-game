import type { Cell, Direction, Monster, Position } from '../types'
import { getForwardPosition, getTurnDirections, isValidMove } from './straight'

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
 * Check if a position has enough open area for a nest (3x3 or larger open area)
 */
export function canEstablishNest(position: Position, grid: Cell[][]): boolean {
  let openCount = 0

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const pos = { x: position.x + dx, y: position.y + dy }
      if (isValidMove(pos, grid)) {
        openCount++
      }
    }
  }

  // Need at least 5 open cells (including center) for reasonable nest
  return openCount >= 5
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
 * Calculate next move for stationary pattern (Lizardman)
 * Establishes nest in open area and patrols around it.
 * Falls back to straight movement if no nest.
 */
export function calculateStationaryMove(
  monster: Monster,
  grid: Cell[][],
  randomFn: () => number = Math.random
): { position: Position; direction: Direction; nestPosition: Position | null } {
  // No nest yet - try to establish one
  if (monster.nestPosition === null) {
    if (canEstablishNest(monster.position, grid)) {
      // Establish nest at current position and start patrolling
      const patrolPositions = getPatrolPositions(monster.position, grid)
      if (patrolPositions.length > 0) {
        const targetIdx = Math.floor(randomFn() * patrolPositions.length)
        const target = patrolPositions[targetIdx]
        const direction = getDirectionToward(monster.position, target)
        return {
          position: target,
          direction,
          nestPosition: monster.position,
        }
      }
      // Can establish but no patrol positions - stay
      return {
        position: monster.position,
        direction: monster.direction,
        nestPosition: monster.position,
      }
    }

    // Cannot establish nest - use straight pattern fallback
    return straightFallback(monster, grid, randomFn)
  }

  // Has nest - patrol around it
  const patrolPositions = getPatrolPositions(monster.nestPosition, grid)

  if (patrolPositions.length === 0) {
    // No patrol positions available - stay at nest
    return {
      position: monster.nestPosition,
      direction: monster.direction,
      nestPosition: monster.nestPosition,
    }
  }

  // Move to a random patrol position
  const targetIdx = Math.floor(randomFn() * patrolPositions.length)
  const target = patrolPositions[targetIdx]
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
