import type { Cell, Direction, Monster, Position } from '../types'
import { HUNGER_THRESHOLD_RATIO } from '../constants'
import { calculateStraightMove, getForwardPosition, isValidMove } from './straight'
import { calculateRefractionMove } from './refraction'
import { calculateStationaryMove } from './stationary'

export interface MoveResult {
  position: Position
  direction: Direction
  nestPosition: Position | null
}

/**
 * Check if monster is hungry
 */
export function isHungry(monster: Monster): boolean {
  return monster.life < monster.maxLife * HUNGER_THRESHOLD_RATIO
}

/**
 * Detect prey in each direction
 */
export function detectPrey(
  monster: Monster,
  monsters: Monster[],
  grid: Cell[][]
): Map<Direction, Monster[]> {
  const preyByDirection = new Map<Direction, Monster[]>()
  const directions: Direction[] = ['up', 'down', 'left', 'right']

  for (const dir of directions) {
    const prey: Monster[] = []
    let pos = monster.position

    // Scan up to 5 cells in each direction
    for (let i = 0; i < 5; i++) {
      pos = getForwardPosition(pos, dir)
      if (!isValidMove(pos, grid)) break

      const monstersAtPos = monsters.filter(
        (m) =>
          m.id !== monster.id &&
          m.position.x === pos.x &&
          m.position.y === pos.y &&
          monster.predationTargets.includes(m.type)
      )
      prey.push(...monstersAtPos)
    }

    if (prey.length > 0) {
      preyByDirection.set(dir, prey)
    }
  }

  return preyByDirection
}

/**
 * Prioritize direction where prey exists when hungry
 */
export function prioritizePreyDirection(
  monster: Monster,
  monsters: Monster[],
  grid: Cell[][],
  defaultDirection: Direction,
  _randomFn: () => number = Math.random
): Direction {
  if (!isHungry(monster) || monster.predationTargets.length === 0) {
    return defaultDirection
  }

  const preyByDirection = detectPrey(monster, monsters, grid)

  if (preyByDirection.size === 0) {
    return defaultDirection
  }

  // Find closest prey
  let closestDirection: Direction = defaultDirection
  let closestDistance = Infinity

  for (const [dir, preyList] of preyByDirection) {
    for (const prey of preyList) {
      const distance =
        Math.abs(prey.position.x - monster.position.x) +
        Math.abs(prey.position.y - monster.position.y)
      if (distance < closestDistance) {
        closestDistance = distance
        closestDirection = dir
      }
    }
  }

  return closestDirection
}

/**
 * Calculate move for any monster, applying hunger behavior if needed
 */
export function calculateMove(
  monster: Monster,
  grid: Cell[][],
  monsters: Monster[],
  randomFn: () => number = Math.random
): MoveResult {
  let result: MoveResult

  // Calculate base movement based on pattern
  switch (monster.pattern) {
    case 'straight': {
      const straightResult = calculateStraightMove(monster, grid, randomFn)
      result = {
        ...straightResult,
        nestPosition: null,
      }
      break
    }
    case 'refraction': {
      const refractionResult = calculateRefractionMove(monster, grid, randomFn)
      result = {
        ...refractionResult,
        nestPosition: null,
      }
      break
    }
    case 'stationary': {
      // Stationary pattern handles prey detection internally
      const stationaryResult = calculateStationaryMove(monster, grid, monsters, randomFn)
      result = {
        ...stationaryResult,
      }
      // Skip common hunger behavior for stationary pattern
      return result
    }
  }

  // Apply hunger behavior for predators (non-stationary patterns only)
  if (isHungry(monster) && monster.predationTargets.length > 0) {
    const preyDirection = prioritizePreyDirection(
      monster,
      monsters,
      grid,
      result.direction,
      randomFn
    )

    if (preyDirection !== result.direction) {
      // Override direction to chase prey
      const newPos = getForwardPosition(monster.position, preyDirection)
      if (isValidMove(newPos, grid)) {
        result = {
          ...result,
          position: newPos,
          direction: preyDirection,
        }
      }
    }
  }

  return result
}

export { getForwardPosition, isValidMove, getTurnDirections } from './straight'
export { calculateStraightMove } from './straight'
export { calculateRefractionMove } from './refraction'
export { calculateStationaryMove } from './stationary'
