import type { Cell, GameEvent, GameState, Monster, Nutrient, Position } from './types'
import { MOVEMENT_LIFE_COST, MONSTER_CONFIGS } from './constants'
import { calculateMove, MoveResult } from './movement'
import { processPredation } from './predation'
import { pickupNutrient, depositNutrient, depleteOnDig, generateNutrientId } from './nutrient'

let monsterIdCounter = 0

export function generateMonsterId(): string {
  return `monster-${++monsterIdCounter}`
}

export function resetMonsterIdCounter(): void {
  monsterIdCounter = 0
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
    result: calculateMove(monster, state.grid, state.nutrients, state.monsters, randomFn),
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
export function applyMovements(
  plannedMoves: PlannedMove[],
  nutrients: Nutrient[]
): { monsters: Monster[]; nutrients: Nutrient[]; events: GameEvent[] } {
  const events: GameEvent[] = []
  let updatedNutrients = [...nutrients]

  const movedMonsters = plannedMoves.map((move) => {
    let monster = {
      ...move.monster,
      position: move.result.position,
      direction: move.result.direction,
      nestPosition: move.result.nestPosition ?? move.monster.nestPosition,
    }

    // Handle nutrient interactions for Nijirigoke
    if (move.result.nutrientInteraction === 'pickup' && move.result.nutrientId) {
      const nutrient = updatedNutrients.find((n) => n.id === move.result.nutrientId)
      if (nutrient) {
        const result = pickupNutrient(monster, nutrient)
        monster = result.monster
        updatedNutrients = updatedNutrients.map((n) =>
          n.id === nutrient.id ? result.nutrient : n
        )
        events.push({ type: 'NUTRIENT_PICKED', monster, nutrient: result.nutrient })
      }
    } else if (move.result.nutrientInteraction === 'deposit' && move.result.nutrientId) {
      const result = depositNutrient(monster, updatedNutrients)
      monster = result.monster
      updatedNutrients = result.nutrients
      const droppedNutrient = updatedNutrients.find((n) => n.id === move.result.nutrientId)
      if (droppedNutrient) {
        events.push({ type: 'NUTRIENT_DROPPED', monster, nutrient: droppedNutrient })
      }
    }

    return monster
  })

  return { monsters: movedMonsters, nutrients: updatedNutrients, events }
}

/**
 * Decrease life for all monsters that moved
 */
export function decreaseLifeForMoved(
  monsters: Monster[],
  originalPositions: Map<string, Position>
): { monsters: Monster[]; events: GameEvent[] } {
  const events: GameEvent[] = []

  const updated = monsters
    .map((monster) => {
      const original = originalPositions.get(monster.id)
      if (!original) return monster

      // Check if actually moved
      const moved = original.x !== monster.position.x || original.y !== monster.position.y
      if (!moved) return monster

      const newLife = monster.life - MOVEMENT_LIFE_COST
      if (newLife <= 0) {
        events.push({ type: 'MONSTER_DIED', monster, cause: 'starvation' })
        return null
      }

      return { ...monster, life: newLife }
    })
    .filter((m): m is Monster => m !== null)

  return { monsters: updated, events }
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
  const moveResult = applyMovements(resolvedMoves, state.nutrients)
  allEvents.push(...moveResult.events)

  // 4. Process predation (same cell)
  const predationResult = processPredation(moveResult.monsters, moveResult.nutrients)
  allEvents.push(...predationResult.events)

  // 5. Decrease life for moved monsters
  const lifeResult = decreaseLifeForMoved(predationResult.monsters, originalPositions)
  allEvents.push(...lifeResult.events)

  return {
    state: {
      ...state,
      monsters: lifeResult.monsters,
      nutrients: predationResult.nutrients,
    },
    events: allEvents,
  }
}

/**
 * Dig action - dig soil and spawn Nijirigoke
 */
export function dig(
  state: GameState,
  position: Position
): { state: GameState; events: GameEvent[] } | { error: string } {
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

  const events: GameEvent[] = []

  // Calculate available nutrients (70% of soil nutrients)
  const availableNutrients = depleteOnDig(cell.nutrientAmount)

  // Update grid - soil becomes empty
  const newGrid = state.grid.map((row, y) =>
    row.map((c, x) => {
      if (x === position.x && y === position.y) {
        return { type: 'empty' as const, nutrientAmount: 0 }
      }
      return c
    })
  )

  // Spawn Nijirigoke with life based on nutrients
  const config = MONSTER_CONFIGS.nijirigoke
  const spawnedLife = Math.max(1, Math.min(availableNutrients, config.life))

  const newMonster: Monster = {
    id: generateMonsterId(),
    type: 'nijirigoke',
    position: { ...position },
    direction: (['up', 'down', 'left', 'right'] as const)[Math.floor(Math.random() * 4)],
    pattern: config.pattern,
    life: spawnedLife,
    maxLife: config.life,
    attack: config.attack,
    predationTargets: [...config.predationTargets],
    carryingNutrient: null,
    nestPosition: null,
  }

  // Create nutrient if there was any
  let newNutrients = [...state.nutrients]
  if (availableNutrients > 0) {
    const nutrient: Nutrient = {
      id: generateNutrientId(),
      position: { ...position },
      amount: availableNutrients,
      carriedBy: null,
    }
    newNutrients = [...newNutrients, nutrient]
  }

  events.push({ type: 'MONSTER_SPAWNED', monster: newMonster })

  return {
    state: {
      ...state,
      grid: newGrid,
      monsters: [...state.monsters, newMonster],
      nutrients: newNutrients,
    },
    events,
  }
}

/**
 * Create initial game state
 */
export function createGameState(
  width: number,
  height: number,
  soilRatio: number = 0.7
): GameState {
  const grid: Cell[][] = []

  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      // Borders are walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0 })
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
    nutrients: [],
    totalInitialNutrients: 0,
  }
}
