import type {
  Cell,
  GameEvent,
  GameState,
  Monster,
  Position,
} from './types'
import {
  getSurroundingCells,
  releaseNutrientsOnDeath,
} from './nutrient'
import {
  generateMonsterId,
  getMonsterTypeByNutrient,
  INITIAL_PHASE,
} from './spawn'

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
  position: Position,
  randomFn: () => number = Math.random
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
        return { type: 'empty' as const, nutrientAmount: 0, magicAmount: 0 }
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

  // Conservation law: 100% of soil nutrients must be preserved
  // life = min(N, maxLife) per spec; excess nutrients go to carryingNutrient + surrounding cells
  const totalNutrients = cell.nutrientAmount

  // Spawn monster based on nutrient level
  const monsterType = getMonsterTypeByNutrient(totalNutrients, state.config)
  const monsterConfig = state.config.monsters[monsterType]
  const { id: monsterId, nextMonsterId } = generateMonsterId(state)

  // Life based on nutrients (capped at maxLife)
  const initialLife = Math.min(totalNutrients, monsterConfig.life)
  // Remaining nutrients after life allocation go to carryingNutrient + surrounding cells
  const nutrientsAfterLife = totalNutrients - initialLife
  const carried = Math.min(nutrientsAfterLife, state.config.nutrient.carryCapacity)
  const remaining = nutrientsAfterLife - carried

  const newMonster: Monster = {
    id: monsterId,
    type: monsterType,
    position: { ...position },
    direction: (['up', 'down', 'left', 'right'] as const)[Math.floor(randomFn() * 4)],
    pattern: monsterConfig.pattern,
    phase: INITIAL_PHASE[monsterType],
    phaseTickCounter: 0,
    life: initialLife,
    maxLife: monsterConfig.life,
    attack: monsterConfig.attack,
    predationTargets: [...monsterConfig.predationTargets],
    carryingNutrient: carried,
    nestPosition: null,
    nestOrientation: null,
  }

  // Distribute surplus nutrients to surrounding cells
  let finalGrid = newGrid
  if (remaining > 0) {
    const surroundingCells = getSurroundingCells(position, newGrid)
    if (surroundingCells.length > 0) {
      const perCell = Math.floor(remaining / surroundingCells.length)
      let surplus = remaining % surroundingCells.length
      finalGrid = newGrid.map((row, y) =>
        row.map((c, x) => {
          const match = surroundingCells.find((s) => s.x === x && s.y === y)
          if (match) {
            const extra = surplus > 0 ? 1 : 0
            if (surplus > 0) surplus--
            // Conservation law takes priority over MAX_NUTRIENT_PER_CELL cap
            return { ...c, nutrientAmount: c.nutrientAmount + perCell + extra }
          }
          return c
        })
      )
    }
  }

  events.push({ type: 'MONSTER_SPAWNED', monster: newMonster })

  return {
    state: {
      ...state,
      grid: finalGrid,
      monsters: [...state.monsters, newMonster],
      digPower: state.digPower - 1,
      nextMonsterId,
    },
    events,
  }
}

/**
 * Attack a monster with the pickaxe
 * Life is outside conservation law, but carried nutrients are released on death
 */
export function attackMonster(
  state: GameState,
  monsterId: string,
  damage: number
): { state: GameState; events: GameEvent[] } | { error: string } {
  const monsterIndex = state.monsters.findIndex((m) => m.id === monsterId)
  if (monsterIndex === -1) {
    return { error: 'Monster not found' }
  }

  const monster = state.monsters[monsterIndex]
  const events: GameEvent[] = []

  const newLife = monster.life - damage
  events.push({
    type: 'MONSTER_ATTACKED',
    monsterId,
    damage,
    remainingLife: Math.max(0, newLife),
  })

  if (newLife <= 0) {
    // Monster dies - release carried nutrients (conservation law)
    const newGrid = releaseNutrientsOnDeath(monster, state.grid)
    events.push({ type: 'MONSTER_DIED', monster, cause: 'pickaxe' })

    return {
      state: {
        ...state,
        grid: newGrid,
        monsters: state.monsters.filter((m) => m.id !== monsterId),
      },
      events,
    }
  }

  // Monster survives
  const updatedMonsters = state.monsters.map((m) =>
    m.id === monsterId ? { ...m, life: newLife } : m
  )

  return {
    state: { ...state, monsters: updatedMonsters },
    events,
  }
}
