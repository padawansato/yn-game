import { NUTRIENT_SPAWN_THRESHOLDS, INITIAL_DIG_POWER } from './constants'
import type { Cell, GameEvent, GameState, Monster, MonsterType, Position } from './types'
import { MOVEMENT_LIFE_COST, MONSTER_CONFIGS } from './constants'
import { calculateMove, MoveResult } from './movement'
import { processPredation } from './predation'
import { depleteOnDig, absorbNutrient, releaseNutrient, releaseNutrientsOnDeath } from './nutrient'

let monsterIdCounter = 0

export function generateMonsterId(): string {
  return `monster-${++monsterIdCounter}`
}

export function resetMonsterIdCounter(): void {
  monsterIdCounter = 0
}

function getMonsterTypeByNutrient(nutrientAmount: number): MonsterType {
  if (nutrientAmount >= NUTRIENT_SPAWN_THRESHOLDS.LIZARDMAN) {
    return 'lizardman'
  }
  if (nutrientAmount >= NUTRIENT_SPAWN_THRESHOLDS.GAJIGAJIMUSHI) {
    return 'gajigajimushi'
  }
  return 'nijirigoke'
}

interface PlannedMove {
  monster: Monster
  result: MoveResult
}

/**
 * Calculate all monster moves simultaneously
 */
export function calculateAllMoves(
  state: GameState,
  randomFn: () => number = Math.random
): PlannedMove[] {
  return state.monsters.map((monster) => ({
    monster,
    result: calculateMove(monster, state.grid, state.monsters, randomFn),
  }))
}

/**
 * Resolve conflicts when multiple monsters try to move to same position
 * Returns monsters that successfully moved and those that stay
 */
export function resolveConflicts(
  plannedMoves: PlannedMove[],
  randomFn: () => number = Math.random
): PlannedMove[] {
  const targetPositions = new Map<string, PlannedMove[]>()

  // Group by target position
  for (const move of plannedMoves) {
    const key = `${move.result.position.x},${move.result.position.y}`
    const list = targetPositions.get(key) || []
    list.push(move)
    targetPositions.set(key, list)
  }

  const resolvedMoves: PlannedMove[] = []

  for (const [, moves] of targetPositions) {
    if (moves.length === 1) {
      resolvedMoves.push(moves[0])
      continue
    }

    // Multiple monsters targeting same position
    // Check for predator-prey relationship first
    let predatorMove: PlannedMove | null = null
    let preyMove: PlannedMove | null = null

    for (const move of moves) {
      for (const other of moves) {
        if (
          move.monster.id !== other.monster.id &&
          move.monster.predationTargets.includes(other.monster.type)
        ) {
          predatorMove = move
          preyMove = other
          break
        }
      }
      if (predatorMove) break
    }

    if (predatorMove && preyMove) {
      // Predator gets the position, prey also moves (will be eaten)
      resolvedMoves.push(predatorMove)
      resolvedMoves.push(preyMove)
    } else {
      // Random selection for non-predation conflicts
      const winner = moves[Math.floor(randomFn() * moves.length)]
      resolvedMoves.push(winner)

      // Others stay in place
      for (const move of moves) {
        if (move !== winner) {
          resolvedMoves.push({
            monster: move.monster,
            result: {
              ...move.result,
              position: move.monster.position,
            },
          })
        }
      }
    }
  }

  return resolvedMoves
}

/**
 * Apply all resolved movements to monsters
 */
export function applyMovements(plannedMoves: PlannedMove[]): { monsters: Monster[] } {
  const movedMonsters = plannedMoves.map((move) => ({
    ...move.monster,
    position: move.result.position,
    direction: move.result.direction,
    nestPosition: move.result.nestPosition ?? move.monster.nestPosition,
  }))

  return { monsters: movedMonsters }
}

/**
 * Process nutrient absorption and release for all Nijirigoke
 */
export function processNutrientInteractions(
  monsters: Monster[],
  grid: Cell[][]
): { monsters: Monster[]; grid: Cell[][]; events: GameEvent[] } {
  const events: GameEvent[] = []
  let currentGrid = grid
  const updatedMonsters: Monster[] = []

  for (const monster of monsters) {
    if (monster.type !== 'nijirigoke') {
      updatedMonsters.push(monster)
      continue
    }

    // Try to absorb first
    const absorbResult = absorbNutrient(monster, currentGrid)
    if (absorbResult.monster.carryingNutrient > monster.carryingNutrient) {
      // Successfully absorbed
      const absorbed = absorbResult.monster.carryingNutrient - monster.carryingNutrient
      events.push({
        type: 'NUTRIENT_ABSORBED',
        monster: absorbResult.monster,
        amount: absorbed,
        fromPosition: monster.position,
      })
      currentGrid = absorbResult.grid
      updatedMonsters.push(absorbResult.monster)
      continue
    }

    // Try to release if not absorbed
    const releaseResult = releaseNutrient(monster, currentGrid)
    if (releaseResult.monster.carryingNutrient < monster.carryingNutrient) {
      // Successfully released
      const released = monster.carryingNutrient - releaseResult.monster.carryingNutrient
      events.push({
        type: 'NUTRIENT_RELEASED',
        monster: releaseResult.monster,
        amount: released,
        toPosition: monster.position,
      })
      currentGrid = releaseResult.grid
      updatedMonsters.push(releaseResult.monster)
      continue
    }

    // No interaction
    updatedMonsters.push(monster)
  }

  return { monsters: updatedMonsters, grid: currentGrid, events }
}

/**
 * Decrease life for all monsters that moved
 */
export function decreaseLifeForMoved(
  monsters: Monster[],
  originalPositions: Map<string, Position>,
  grid: Cell[][]
): { monsters: Monster[]; grid: Cell[][]; events: GameEvent[] } {
  const events: GameEvent[] = []
  let currentGrid = grid

  const updated = monsters
    .map((monster) => {
      const original = originalPositions.get(monster.id)
      if (!original) return monster

      // Check if actually moved
      const moved = original.x !== monster.position.x || original.y !== monster.position.y
      if (!moved) return monster

      if (monster.type === 'nijirigoke' && monster.carryingNutrient > 0) {
        return { ...monster, carryingNutrient: monster.carryingNutrient - 1 }
      }
      const newLife = monster.life - MOVEMENT_LIFE_COST
      if (newLife <= 0) {
        events.push({ type: 'MONSTER_DIED', monster, cause: 'starvation' })
        // Release nutrients on death
        currentGrid = releaseNutrientsOnDeath(monster, currentGrid)
        return null
      }

      return { ...monster, life: newLife }
    })
    .filter((m): m is Monster => m !== null)

  return { monsters: updated, grid: currentGrid, events }
}

/**
 * Main tick function - orchestrates all steps
 */
export function tick(
  state: GameState,
  randomFn: () => number = Math.random
): { state: GameState; events: GameEvent[] } {
  const allEvents: GameEvent[] = []

  // Save original positions for movement detection
  const originalPositions = new Map<string, Position>()
  for (const monster of state.monsters) {
    originalPositions.set(monster.id, { ...monster.position })
  }

  // 1. Calculate all moves
  const plannedMoves = calculateAllMoves(state, randomFn)

  // 2. Resolve conflicts
  const resolvedMoves = resolveConflicts(plannedMoves, randomFn)

  // 3. Apply movements
  const moveResult = applyMovements(resolvedMoves)

  // 4. Process predation (same cell)
  const predationResult = processPredation(moveResult.monsters, state.grid)
  allEvents.push(...predationResult.events)

  // 5. Decrease life for moved monsters (and release nutrients on death)
  const lifeResult = decreaseLifeForMoved(
    predationResult.monsters,
    originalPositions,
    predationResult.grid
  )
  allEvents.push(...lifeResult.events)

  // 6. Process nutrient absorption/release for Nijirigoke
  const nutrientResult = processNutrientInteractions(lifeResult.monsters, lifeResult.grid)
  allEvents.push(...nutrientResult.events)

  return {
    state: {
      ...state,
      grid: nutrientResult.grid,
      monsters: nutrientResult.monsters,
    },
    events: allEvents,
  }
}

/**
 * Check if a position is adjacent to an empty cell
 */
export function isAdjacentToEmpty(position: Position, grid: Cell[][]): boolean {
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 }, // right
  ]

  for (const dir of directions) {
    const nx = position.x + dir.x
    const ny = position.y + dir.y

    if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[0].length) {
      if (grid[ny][nx].type === 'empty') {
        return true
      }
    }
  }

  return false
}

/**
 * Dig action - dig soil and spawn Nijirigoke (only if soil has nutrients)
 * Can only dig blocks adjacent to empty cells
 * Requires dig power to execute
 */
export function dig(
  state: GameState,
  position: Position
): { state: GameState; events: GameEvent[] } | { error: string } {
  // Check dig power first
  if (state.digPower <= 0) {
    return { error: 'insufficient dig power' }
  }

  // Validate position
  if (
    position.y < 0 ||
    position.y >= state.grid.length ||
    position.x < 0 ||
    position.x >= state.grid[0].length
  ) {
    return { error: 'Position out of bounds' }
  }

  const cell = state.grid[position.y][position.x]

  // Must be soil
  if (cell.type !== 'soil') {
    return { error: 'Can only dig soil blocks' }
  }

  // Must be adjacent to empty cell
  if (!isAdjacentToEmpty(position, state.grid)) {
    return { error: 'Can only dig blocks adjacent to empty space' }
  }

  const events: GameEvent[] = []

  // Update grid - soil becomes empty
  const newGrid = state.grid.map((row, y) =>
    row.map((c, x) => {
      if (x === position.x && y === position.y) {
        return { type: 'empty' as const, nutrientAmount: 0 }
      }
      return c
    })
  )

  // If soil has no nutrients, just create empty cell without spawning Nijirigoke
  if (cell.nutrientAmount === 0) {
    return {
      state: {
        ...state,
        grid: newGrid,
        digPower: state.digPower - 1,
      },
      events,
    }
  }

  // Calculate available nutrients (70% of soil nutrients, 30% lost)
  const availableNutrients = depleteOnDig(cell.nutrientAmount)

  // Spawn Nijirigoke with life based on nutrients
  const monsterType = getMonsterTypeByNutrient(cell.nutrientAmount)
  const config = MONSTER_CONFIGS[monsterType]
  const spawnedLife = Math.max(1, Math.min(availableNutrients, config.life))

  const newMonster: Monster = {
    id: generateMonsterId(),
    type: monsterType,
    position: { ...position },
    direction: (['up', 'down', 'left', 'right'] as const)[Math.floor(Math.random() * 4)],
    pattern: config.pattern,
    life: spawnedLife,
    maxLife: config.life,
    attack: config.attack,
    predationTargets: [...config.predationTargets],
    carryingNutrient: 0, // Starts with no nutrients
    nestPosition: null,
  }

  events.push({ type: 'MONSTER_SPAWNED', monster: newMonster })

  return {
    state: {
      ...state,
      grid: newGrid,
      monsters: [...state.monsters, newMonster],
      digPower: state.digPower - 1,
    },
    events,
  }
}

/**
 * Create initial game state
 * Includes an initial empty cell at the top center for digging entry point
 */
export function createGameState(width: number, height: number, soilRatio: number = 0.7): GameState {
  const grid: Cell[][] = []

  // Calculate entry point position (top center, one row below the wall)
  const entryX = Math.floor(width / 2)
  const entryY = 1

  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      // Borders are walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0 })
      } else if (x === entryX && y === entryY) {
        // Entry point - initial empty cell for digging
        row.push({ type: 'empty', nutrientAmount: 0 })
      } else if (Math.random() < soilRatio) {
        row.push({ type: 'soil', nutrientAmount: 0 })
      } else {
        row.push({ type: 'empty', nutrientAmount: 0 })
      }
    }
    grid.push(row)
  }

  return {
    grid,
    monsters: [],
    totalInitialNutrients: 0,
    digPower: INITIAL_DIG_POWER,
  }
}
