import type { Cell, Direction, Monster, Position } from '../types'
import { getForwardPosition, getTurnDirections, isValidMove } from './straight'

/**
 * Calculate next move for refraction pattern (Gajigajimushi)
 * Always tries to turn when possible. If both left and right are available,
 * chooses randomly. If stuck, makes U-turn.
 */
export function calculateRefractionMove(
  monster: Monster,
  grid: Cell[][],
  randomFn: () => number = Math.random
): { position: Position; direction: Direction } {
  const turns = getTurnDirections(monster.direction)

  // Check available turn directions
  const leftPos = getForwardPosition(monster.position, turns.left)
  const rightPos = getForwardPosition(monster.position, turns.right)
  const forwardPos = getForwardPosition(monster.position, monster.direction)
  const backPos = getForwardPosition(monster.position, turns.back)

  const canLeft = isValidMove(leftPos, grid)
  const canRight = isValidMove(rightPos, grid)
  const canForward = isValidMove(forwardPos, grid)
  const canBack = isValidMove(backPos, grid)

  // Priority: Turn > Forward > U-turn

  // Both turns available - random choice
  if (canLeft && canRight) {
    if (randomFn() < 0.5) {
      return { position: leftPos, direction: turns.left }
    } else {
      return { position: rightPos, direction: turns.right }
    }
  }

  // Only left turn available
  if (canLeft) {
    return { position: leftPos, direction: turns.left }
  }

  // Only right turn available
  if (canRight) {
    return { position: rightPos, direction: turns.right }
  }

  // No turn possible, go forward if possible
  if (canForward) {
    return { position: forwardPos, direction: monster.direction }
  }

  // Stuck - U-turn
  if (canBack) {
    return { position: backPos, direction: turns.back }
  }

  // Completely stuck - stay in place
  return { position: monster.position, direction: monster.direction }
}
