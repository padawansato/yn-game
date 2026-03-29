import type { Cell, Direction, Monster, Position } from '../types'
import type { GameConfig } from '../config'
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
    {
      offsets: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
      ],
    },
    {
      offsets: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
    },
    {
      offsets: [
        { x: -2, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: -2, y: 1 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
      ],
    },
    {
      offsets: [
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: 2, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
      ],
    },
    {
      offsets: [
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    },
    {
      offsets: [
        { x: -2, y: -1 },
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: -2, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
      ],
    },
    // 3x2 (width=2, height=3) patterns - position can be at any of the 6 cells
    {
      offsets: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
      ],
    },
    {
      offsets: [
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
        { x: -1, y: 2 },
        { x: 0, y: 2 },
      ],
    },
    {
      offsets: [
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
      ],
    },
    {
      offsets: [
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
        { x: -1, y: 1 },
        { x: 0, y: 1 },
      ],
    },
    {
      offsets: [
        { x: 0, y: -2 },
        { x: 1, y: -2 },
        { x: 0, y: -1 },
        { x: 1, y: -1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    },
    {
      offsets: [
        { x: -1, y: -2 },
        { x: 0, y: -2 },
        { x: -1, y: -1 },
        { x: 0, y: -1 },
        { x: -1, y: 0 },
        { x: 0, y: 0 },
      ],
    },
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
 * Find a 2x3 or 3x2 nest area containing the position.
 * Returns the nest center and orientation, or null if no valid space.
 *
 * horizontal (3 wide × 2 tall): center = middle of top row (offset index 1)
 * vertical (2 wide × 3 tall): center = middle-left of center row (offset index 2)
 */
export function findNestArea(
  position: Position,
  grid: Cell[][]
): { center: Position; orientation: 'horizontal' | 'vertical' } | null {
  const patterns: { offsets: { x: number; y: number }[]; orientation: 'horizontal' | 'vertical' }[] = [
    // horizontal (width=3, height=2)
    { offsets: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }], orientation: 'horizontal' },
    { offsets: [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }], orientation: 'horizontal' },
    { offsets: [{ x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: -2, y: 1 }, { x: -1, y: 1 }, { x: 0, y: 1 }], orientation: 'horizontal' },
    { offsets: [{ x: 0, y: -1 }, { x: 1, y: -1 }, { x: 2, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }], orientation: 'horizontal' },
    { offsets: [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }], orientation: 'horizontal' },
    { offsets: [{ x: -2, y: -1 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }], orientation: 'horizontal' },
    // vertical (width=2, height=3)
    { offsets: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }], orientation: 'vertical' },
    { offsets: [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }, { x: -1, y: 2 }, { x: 0, y: 2 }], orientation: 'vertical' },
    { offsets: [{ x: 0, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }], orientation: 'vertical' },
    { offsets: [{ x: -1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: -1, y: 1 }, { x: 0, y: 1 }], orientation: 'vertical' },
    { offsets: [{ x: 0, y: -2 }, { x: 1, y: -2 }, { x: 0, y: -1 }, { x: 1, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }], orientation: 'vertical' },
    { offsets: [{ x: -1, y: -2 }, { x: 0, y: -2 }, { x: -1, y: -1 }, { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 0, y: 0 }], orientation: 'vertical' },
  ]

  for (const pattern of patterns) {
    const allOpen = pattern.offsets.every((offset) => {
      const pos = { x: position.x + offset.x, y: position.y + offset.y }
      return isValidMove(pos, grid)
    })
    if (allOpen) {
      // Calculate center: average of all 6 cells, floored
      const sumX = pattern.offsets.reduce((s, o) => s + position.x + o.x, 0)
      const sumY = pattern.offsets.reduce((s, o) => s + position.y + o.y, 0)
      const center = { x: Math.floor(sumX / 6), y: Math.floor(sumY / 6) }
      return { center, orientation: pattern.orientation }
    }
  }
  return null
}

/**
 * Check if a position has enough open area for a nest (2x3 or 3x2 contiguous space)
 */
export function canEstablishNest(position: Position, grid: Cell[][]): boolean {
  return findNestArea(position, grid) !== null
}

/**
 * Get the 6 cells of a nest given its center and orientation
 */
export function getNestCells(center: Position, orientation: 'horizontal' | 'vertical'): Position[] {
  if (orientation === 'horizontal') {
    // 3 wide × 2 tall, center is middle of area
    return [
      { x: center.x - 1, y: center.y }, { x: center.x, y: center.y }, { x: center.x + 1, y: center.y },
      { x: center.x - 1, y: center.y + 1 }, { x: center.x, y: center.y + 1 }, { x: center.x + 1, y: center.y + 1 },
    ]
  } else {
    // 2 wide × 3 tall, center is middle of area
    return [
      { x: center.x, y: center.y - 1 }, { x: center.x + 1, y: center.y - 1 },
      { x: center.x, y: center.y }, { x: center.x + 1, y: center.y },
      { x: center.x, y: center.y + 1 }, { x: center.x + 1, y: center.y + 1 },
    ]
  }
}

/**
 * Check if a position is within a nest area
 */
export function isInNestArea(position: Position, nestCenter: Position, orientation: 'horizontal' | 'vertical'): boolean {
  const cells = getNestCells(nestCenter, orientation)
  return cells.some(c => c.x === position.x && c.y === position.y)
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
  grid: Cell[][],
  config: GameConfig
): Direction | null {
  if (!isHungry(monster, config) || monster.predationTargets.length === 0) {
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
  config: GameConfig,
  randomFn: () => number = Math.random
): {
  position: Position
  direction: Direction
  nestPosition: Position | null
  nestOrientation: 'horizontal' | 'vertical' | null
} {
  // No nest yet - try to establish one
  if (monster.nestPosition === null) {
    const nestInfo = findNestArea(monster.position, grid)
    if (nestInfo &&
        monster.carryingNutrient >= config.monsters.lizardman.nestNutrientCost! &&
        monster.life > config.monsters.lizardman.nestLifeCost!) {
      // Establish nest, record center and orientation
      return {
        position: monster.position,
        direction: monster.direction,
        nestPosition: nestInfo.center,
        nestOrientation: nestInfo.orientation,
      }
    }

    // Try to share another lizardman's nest (no cost)
    const existingNest = monsters.find(
      m => m.id !== monster.id && m.type === 'lizardman' && m.nestPosition !== null && m.nestOrientation !== null
    )
    if (existingNest) {
      return {
        position: monster.position,
        direction: monster.direction,
        nestPosition: existingNest.nestPosition!,
        nestOrientation: existingNest.nestOrientation,
      }
    }

    // Cannot establish or share nest - use straight pattern fallback
    return straightFallback(monster, grid, randomFn)
  }

  // Ready to lay eggs - return to nest center
  if (
    (monster.phase === 'normal' || monster.phase === 'nesting') &&
    monster.carryingNutrient >= config.monsters.lizardman.layingNutrientThreshold! &&
    monster.life >= config.monsters.lizardman.layingLifeThreshold!
  ) {
    // Already at nest center - stay
    if (
      monster.position.x === monster.nestPosition.x &&
      monster.position.y === monster.nestPosition.y
    ) {
      return {
        position: monster.position,
        direction: monster.direction,
        nestPosition: monster.nestPosition,
        nestOrientation: monster.nestOrientation,
      }
    }
    // Move toward nest center
    const direction = getDirectionToward(monster.position, monster.nestPosition)
    const targetPos = getForwardPosition(monster.position, direction)
    if (isValidMove(targetPos, grid)) {
      return {
        position: targetPos,
        direction,
        nestPosition: monster.nestPosition,
        nestOrientation: monster.nestOrientation,
      }
    }
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
      nestOrientation: monster.nestOrientation,
    }
  }

  // When hungry, prioritize moving toward prey
  const preyDirection = findPreyDirection(monster, monsters, grid, config)
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
        nestOrientation: monster.nestOrientation,
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
    nestOrientation: monster.nestOrientation,
  }
}

/**
 * Fallback to straight movement when no nest can be established
 */
function straightFallback(
  monster: Monster,
  grid: Cell[][],
  randomFn: () => number
): { position: Position; direction: Direction; nestPosition: null; nestOrientation: null } {
  const forwardPos = getForwardPosition(monster.position, monster.direction)

  if (isValidMove(forwardPos, grid)) {
    return {
      position: forwardPos,
      direction: monster.direction,
      nestPosition: null,
      nestOrientation: null,
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
      nestOrientation: null,
    }
  }

  const idx = Math.floor(randomFn() * options.length)
  const newDir = options[idx]

  return {
    position: monster.position,
    direction: newDir,
    nestPosition: null,
    nestOrientation: null,
  }
}
