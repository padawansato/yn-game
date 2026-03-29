import type {
  GameState,
  Monster,
} from './types'
import { calculateMove, MoveResult } from './movement'

export interface PlannedMove {
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

      // Others stay in place
      for (const move of moves) {
        if (move !== predatorMove && move !== preyMove) {
          resolvedMoves.push({
            monster: move.monster,
            result: {
              ...move.result,
              position: move.monster.position,
            },
          })
        }
      }
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
    nestOrientation: move.result.nestOrientation ?? move.monster.nestOrientation,
  }))

  return { monsters: movedMonsters }
}
