import {
  NUTRIENT_SPAWN_THRESHOLDS,
  INITIAL_DIG_POWER,
  NUTRIENT_CARRY_CAPACITY,
  BUD_NUTRIENT_THRESHOLD,
  BUD_LIFE_THRESHOLD,
  FLOWER_NUTRIENT_THRESHOLD,
  PUPA_NUTRIENT_THRESHOLD,
  PUPA_DURATION,
  LAYING_NUTRIENT_THRESHOLD,
  LAYING_LIFE_THRESHOLD,
  LAYING_DURATION,
  EGG_HATCH_DURATION,
  MOVEMENT_LIFE_COST,
  MONSTER_CONFIGS,
  NEST_NUTRIENT_COST,
  NEST_LIFE_COST,
  GAJI_REPRO_LIFE_THRESHOLD,
  GAJI_REPRO_LIFE_COST,
  MOYOMOYO_DAMAGE,
  HERO_SPAWN_START_TICK,
  HERO_SPAWN_INTERVAL,
} from './constants'
import type {
  Cell,
  GameEvent,
  GameState,
  Monster,
  MonsterType,
  MonsterPhase,
  Position,
} from './types'
import { calculateMove, MoveResult } from './movement'
import { processPredation } from './predation'
import {
  absorbNutrient,
  releaseNutrient,
  releaseNutrientsOnDeath,
  getSurroundingCells,
} from './nutrient'
import { processHeroSpawns, calculateHeroMove } from './hero'
import { processCombat } from './combat'

const INITIAL_PHASE: Record<MonsterType, MonsterPhase> = {
  nijirigoke: 'mobile',
  gajigajimushi: 'larva',
  lizardman: 'normal',
}

export function generateMonsterId(state: GameState): { id: string; nextMonsterId: number } {
  const id = `monster-${state.nextMonsterId + 1}`
  return { id, nextMonsterId: state.nextMonsterId + 1 }
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

/**
 * Process nest establishment cost for lizardmen that just built a nest
 */
export function processNestEstablishment(
  monsters: Monster[],
  originalNestPositions: Map<string, Position | null>
): { monsters: Monster[]; events: GameEvent[] } {
  const events: GameEvent[] = []
  const updated = monsters.map(monster => {
    const originalNest = originalNestPositions.get(monster.id)
    if (originalNest === null && monster.nestPosition !== null) {
      // Nest newly established - deduct cost
      return {
        ...monster,
        carryingNutrient: monster.carryingNutrient - NEST_NUTRIENT_COST,
        life: monster.life - NEST_LIFE_COST,
      }
    }
    return monster
  })
  return { monsters: updated, events }
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
 * Mutable counter for generating unique monster IDs within a single tick
 */
interface IdCounter {
  value: number
}

function generateId(counter: IdCounter): string {
  counter.value++
  return `monster-${counter.value}`
}

/**
 * Apply moyomoyo (flower ranged attack) from all flower-phase Nijirigoke.
 * Each flower deals MOYOMOYO_DAMAGE to all gajigajimushi within its 9-cell area.
 */
export function applyMoyomoyoAttacks(
  monsters: Monster[],
  grid: Cell[][],
  events: GameEvent[]
): { monsters: Monster[]; grid: Cell[][] } {
  const flowers = monsters.filter(
    (m) => m.type === 'nijirigoke' && m.phase === 'flower'
  )

  if (flowers.length === 0) {
    return { monsters, grid }
  }

  // Build a set of dead monster IDs to track kills across multiple flowers
  const deadIds = new Set<string>()
  // Track cumulative damage per monster (multiple flowers can stack)
  const damageMap = new Map<string, number>()

  for (const flower of flowers) {
    const surrounding = getSurroundingCells(flower.position, grid)
    const posSet = new Set(surrounding.map((p) => `${p.x},${p.y}`))

    for (const target of monsters) {
      if (target.type !== 'gajigajimushi') continue
      if (deadIds.has(target.id)) continue

      const key = `${target.position.x},${target.position.y}`
      if (!posSet.has(key)) continue

      // Accumulate damage
      const prevDamage = damageMap.get(target.id) ?? 0
      damageMap.set(target.id, prevDamage + MOYOMOYO_DAMAGE)

      events.push({
        type: 'MOYOMOYO_ATTACK',
        attackerId: flower.id,
        targetId: target.id,
        damage: MOYOMOYO_DAMAGE,
        position: { ...target.position },
      })

      // Check if accumulated damage kills the target
      const totalDamage = prevDamage + MOYOMOYO_DAMAGE
      if (target.life - totalDamage <= 0) {
        deadIds.add(target.id)
      }
    }
  }

  // Apply damage and handle deaths
  let currentGrid = grid
  const survivingMonsters: Monster[] = []

  for (const m of monsters) {
    const damage = damageMap.get(m.id)
    if (damage === undefined) {
      survivingMonsters.push(m)
      continue
    }

    const newLife = m.life - damage
    if (newLife <= 0) {
      // Dead - release nutrients
      events.push({ type: 'MONSTER_DIED', monster: m, cause: 'starvation' })
      currentGrid = releaseNutrientsOnDeath(m, currentGrid)
    } else {
      survivingMonsters.push({ ...m, life: newLife })
    }
  }

  return { monsters: survivingMonsters, grid: currentGrid }
}

/**
 * Process phase transitions for all monsters
 * Called after life decrease/death in tick()
 */
export function processPhaseTransitions(state: GameState): {
  monsters: Monster[]
  grid: Cell[][]
  events: GameEvent[]
  newMonsters: Monster[]
  nextMonsterId: number
} {
  const events: GameEvent[] = []
  const updatedMonsters: Monster[] = []
  const newMonsters: Monster[] = []
  let currentGrid = state.grid
  const idCounter: IdCounter = { value: state.nextMonsterId }

  for (const monster of state.monsters) {
    const result = processMonsterPhase(monster, currentGrid, idCounter, events, newMonsters)
    // Filter out dead monsters (life < 0 signals death after reproduction)
    if (result.monster.life >= 0) {
      updatedMonsters.push(result.monster)
    }
    currentGrid = result.grid
  }

  // Apply moyomoyo attacks from flower-phase Nijirigoke
  const allMonsters = [...updatedMonsters, ...newMonsters]
  const moyomoyoResult = applyMoyomoyoAttacks(allMonsters, currentGrid, events)

  // Separate new monsters from the result (for the newMonsters return field)
  const moyomoyoNewIds = new Set(newMonsters.map((m) => m.id))
  const finalNew = moyomoyoResult.monsters.filter((m) => moyomoyoNewIds.has(m.id))

  return {
    monsters: moyomoyoResult.monsters,
    grid: moyomoyoResult.grid,
    events,
    newMonsters: finalNew,
    nextMonsterId: idCounter.value,
  }
}

function processMonsterPhase(
  monster: Monster,
  grid: Cell[][],
  idCounter: IdCounter,
  events: GameEvent[],
  newMonsters: Monster[]
): { monster: Monster; grid: Cell[][] } {
  switch (monster.type) {
    case 'nijirigoke':
      return processNijirigokePhase(monster, grid, idCounter, events, newMonsters)
    case 'gajigajimushi':
      return processGajigajimushiPhase(monster, grid, idCounter, events, newMonsters)
    case 'lizardman':
      return processLizardmanPhase(monster, grid, idCounter, events, newMonsters)
    default:
      return { monster, grid }
  }
}

function processNijirigokePhase(
  monster: Monster,
  grid: Cell[][],
  idCounter: IdCounter,
  events: GameEvent[],
  newMonsters: Monster[]
): { monster: Monster; grid: Cell[][] } {
  const phase = monster.phase

  // mobile → bud
  if (
    phase === 'mobile' &&
    monster.carryingNutrient >= BUD_NUTRIENT_THRESHOLD &&
    monster.life <= BUD_LIFE_THRESHOLD
  ) {
    events.push({
      type: 'PHASE_TRANSITION',
      monsterId: monster.id,
      oldPhase: 'mobile',
      newPhase: 'bud',
    })
    return { monster: { ...monster, phase: 'bud', phaseTickCounter: 0 }, grid }
  }

  // bud → flower
  if (phase === 'bud' && monster.carryingNutrient >= FLOWER_NUTRIENT_THRESHOLD) {
    events.push({
      type: 'PHASE_TRANSITION',
      monsterId: monster.id,
      oldPhase: 'bud',
      newPhase: 'flower',
    })
    return { monster: { ...monster, phase: 'flower', phaseTickCounter: 0 }, grid }
  }

  // flower: accelerated life drain (2x normal rate) + transition to withered
  if (phase === 'flower') {
    const newLife = monster.life - 2
    if (newLife <= 0) {
      events.push({
        type: 'PHASE_TRANSITION',
        monsterId: monster.id,
        oldPhase: 'flower',
        newPhase: 'withered',
      })
      return { monster: { ...monster, life: 0, phase: 'withered', phaseTickCounter: 0 }, grid }
    }
    return { monster: { ...monster, life: newLife }, grid }
  }

  // withered: reproduce (spawn up to 5 offspring, distribute nutrients evenly)
  if (phase === 'withered' && monster.carryingNutrient > 0) {
    const maxOffspring = 5
    const surroundingCells = getSurroundingCells(monster.position, grid)
    const emptyCells = surroundingCells.filter(
      (pos) =>
        grid[pos.y][pos.x].type === 'empty' &&
        !(pos.x === monster.position.x && pos.y === monster.position.y)
    )

    const spawnCount = Math.min(maxOffspring, emptyCells.length, monster.carryingNutrient)
    if (spawnCount === 0) {
      // No space to reproduce - die and release nutrients (conservation law)
      events.push({ type: 'MONSTER_DIED', monster, cause: 'starvation' })
      const updatedGrid = releaseNutrientsOnDeath(monster, grid)
      return { monster: { ...monster, carryingNutrient: 0, life: -1 }, grid: updatedGrid }
    }
    if (spawnCount > 0) {
      const nutrientsPerChild = Math.floor(monster.carryingNutrient / spawnCount)
      let remainder = monster.carryingNutrient % spawnCount
      const offspringIds: string[] = []
      const positions: Position[] = []

      for (let i = 0; i < spawnCount; i++) {
        const id = generateId(idCounter)
        const extra = remainder > 0 ? 1 : 0
        if (remainder > 0) remainder--

        const child: Monster = {
          id,
          type: 'nijirigoke',
          position: { ...emptyCells[i] },
          direction: (['up', 'down', 'left', 'right'] as const)[i % 4],
          pattern: 'straight',
          phase: 'mobile',
          phaseTickCounter: 0,
          life: MONSTER_CONFIGS.nijirigoke.life,
          maxLife: MONSTER_CONFIGS.nijirigoke.life,
          attack: 0,
          predationTargets: [],
          carryingNutrient: nutrientsPerChild + extra,
          nestPosition: null,
          nestOrientation: null,
        }
        newMonsters.push(child)
        offspringIds.push(id)
        positions.push({ ...emptyCells[i] })
      }

      events.push({
        type: 'MONSTER_REPRODUCED',
        parentId: monster.id,
        offspringIds,
        positions,
      })

      // Parent dies after reproduction (nutrients fully distributed to children)
      events.push({ type: 'MONSTER_DIED', monster, cause: 'starvation' })
      // Return null-like marker to remove parent (set life to -1 as death signal)
      return { monster: { ...monster, carryingNutrient: 0, life: -1 }, grid }
    }
  }

  return { monster, grid }
}

function processGajigajimushiPhase(
  monster: Monster,
  grid: Cell[][],
  idCounter: IdCounter,
  events: GameEvent[],
  newMonsters: Monster[]
): { monster: Monster; grid: Cell[][] } {
  const phase = monster.phase

  // larva → pupa (requires nutrients + at least 2 adjacent empty cells)
  if (phase === 'larva' && monster.carryingNutrient >= PUPA_NUTRIENT_THRESHOLD) {
    const adjacentCells = getSurroundingCells(monster.position, grid)
    const emptyCellCount = adjacentCells.filter(
      (pos) =>
        grid[pos.y][pos.x].type === 'empty' &&
        !(pos.x === monster.position.x && pos.y === monster.position.y)
    ).length
    if (emptyCellCount >= 2) {
      events.push({
        type: 'PHASE_TRANSITION',
        monsterId: monster.id,
        oldPhase: 'larva',
        newPhase: 'pupa',
      })
      return { monster: { ...monster, phase: 'pupa', phaseTickCounter: 0 }, grid }
    }
  }

  // pupa → adult (after PUPA_DURATION ticks)
  if (phase === 'pupa') {
    const newCounter = monster.phaseTickCounter + 1
    if (newCounter >= PUPA_DURATION) {
      events.push({
        type: 'PHASE_TRANSITION',
        monsterId: monster.id,
        oldPhase: 'pupa',
        newPhase: 'adult',
      })
      return { monster: { ...monster, phase: 'adult', phaseTickCounter: 0 }, grid }
    }
    return { monster: { ...monster, phaseTickCounter: newCounter }, grid }
  }

  // adult: reproduce (spawn 1 larva, costs nutrients and life)
  if (
    phase === 'adult' &&
    monster.carryingNutrient >= PUPA_NUTRIENT_THRESHOLD &&
    monster.life > GAJI_REPRO_LIFE_THRESHOLD
  ) {
    const surroundingCells = getSurroundingCells(monster.position, grid)
    const emptyCells = surroundingCells.filter(
      (pos) =>
        grid[pos.y][pos.x].type === 'empty' &&
        !(pos.x === monster.position.x && pos.y === monster.position.y)
    )

    if (emptyCells.length > 0) {
      const id = generateId(idCounter)
      const childNutrients = Math.floor(monster.carryingNutrient / 2)

      const child: Monster = {
        id,
        type: 'gajigajimushi',
        position: { ...emptyCells[0] },
        direction: monster.direction,
        pattern: 'refraction',
        phase: 'larva',
        phaseTickCounter: 0,
        life: MONSTER_CONFIGS.gajigajimushi.life,
        maxLife: MONSTER_CONFIGS.gajigajimushi.life,
        attack: MONSTER_CONFIGS.gajigajimushi.attack,
        predationTargets: [...MONSTER_CONFIGS.gajigajimushi.predationTargets],
        carryingNutrient: childNutrients,
        nestPosition: null,
        nestOrientation: null,
      }
      newMonsters.push(child)
      events.push({
        type: 'MONSTER_REPRODUCED',
        parentId: monster.id,
        offspringIds: [id],
        positions: [{ ...emptyCells[0] }],
      })

      return {
        monster: {
          ...monster,
          carryingNutrient: monster.carryingNutrient - childNutrients,
          life: monster.life - GAJI_REPRO_LIFE_COST,
        },
        grid,
      }
    }
  }

  return { monster, grid }
}

function processLizardmanPhase(
  monster: Monster,
  grid: Cell[][],
  idCounter: IdCounter,
  events: GameEvent[],
  newMonsters: Monster[]
): { monster: Monster; grid: Cell[][] } {
  const phase = monster.phase

  // normal/nesting → laying (must be at nest center)
  if (
    (phase === 'normal' || phase === 'nesting') &&
    monster.nestPosition &&
    monster.nestOrientation &&
    monster.position.x === monster.nestPosition.x &&
    monster.position.y === monster.nestPosition.y &&
    monster.carryingNutrient >= LAYING_NUTRIENT_THRESHOLD &&
    monster.life >= LAYING_LIFE_THRESHOLD
  ) {
    events.push({
      type: 'PHASE_TRANSITION',
      monsterId: monster.id,
      oldPhase: phase,
      newPhase: 'laying',
    })
    return { monster: { ...monster, phase: 'laying', phaseTickCounter: 0 }, grid }
  }

  // laying → spawn egg (after LAYING_DURATION ticks)
  if (phase === 'laying') {
    const newCounter = monster.phaseTickCounter + 1
    if (newCounter >= LAYING_DURATION) {
      // Spawn egg entity
      const eggId = generateId(idCounter)
      const eggNutrients = Math.floor(monster.carryingNutrient / 2)
      const egg: Monster = {
        id: eggId,
        type: 'lizardman',
        position: { ...monster.nestPosition! },
        direction: monster.direction,
        pattern: 'stationary',
        phase: 'egg',
        phaseTickCounter: 0,
        life: 1,
        maxLife: 1,
        attack: 0,
        predationTargets: [],
        carryingNutrient: eggNutrients,
        nestPosition: null,
        nestOrientation: null,
      }
      newMonsters.push(egg)
      events.push({
        type: 'EGG_LAID',
        parentId: monster.id,
        eggId,
        position: { ...monster.nestPosition! },
      })

      // Parent returns to normal, loses half nutrients
      return {
        monster: {
          ...monster,
          phase: 'normal',
          phaseTickCounter: 0,
          carryingNutrient: monster.carryingNutrient - eggNutrients,
        },
        grid,
      }
    }
    return { monster: { ...monster, phaseTickCounter: newCounter }, grid }
  }

  // egg → hatch (after EGG_HATCH_DURATION ticks)
  if (phase === 'egg') {
    const newCounter = monster.phaseTickCounter + 1
    if (newCounter >= EGG_HATCH_DURATION) {
      // Egg hatches into a baby lizardman
      events.push({
        type: 'EGG_HATCHED',
        offspringId: monster.id,
        position: { ...monster.position },
      })
      return {
        monster: {
          ...monster,
          phase: 'normal',
          phaseTickCounter: 0,
          life: MONSTER_CONFIGS.lizardman.life,
          maxLife: MONSTER_CONFIGS.lizardman.life,
          attack: MONSTER_CONFIGS.lizardman.attack,
          predationTargets: [...MONSTER_CONFIGS.lizardman.predationTargets],
        },
        grid,
      }
    }
    return { monster: { ...monster, phaseTickCounter: newCounter }, grid }
  }

  return { monster, grid }
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
        // Deposit 1 nutrient to the cell monster moved from (conservation law)
        const orig = original
        currentGrid = currentGrid.map((row, y) =>
          row.map((c, x) => {
            if (x === orig.x && y === orig.y) {
              return { ...c, nutrientAmount: c.nutrientAmount + 1 }
            }
            return c
          })
        )
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
  // Early return if game is over
  if (state.isGameOver) {
    return { state, events: [] }
  }

  const allEvents: GameEvent[] = []

  // Save original positions for movement detection
  const originalPositions = new Map<string, Position>()
  for (const monster of state.monsters) {
    originalPositions.set(monster.id, { ...monster.position })
  }

  // Save original nest positions for nest establishment detection
  const originalNestPositions = new Map<string, Position | null>()
  for (const monster of state.monsters) {
    originalNestPositions.set(monster.id, monster.nestPosition)
  }

  // 1. Calculate all moves
  const plannedMoves = calculateAllMoves(state, randomFn)

  // 2. Resolve conflicts
  const resolvedMoves = resolveConflicts(plannedMoves, randomFn)

  // 3. Apply movements
  const moveResult = applyMovements(resolvedMoves)

  // 3.5. Process nest establishment cost
  const nestResult = processNestEstablishment(moveResult.monsters, originalNestPositions)
  allEvents.push(...nestResult.events)

  // 4. Process predation (same cell)
  const predationResult = processPredation(nestResult.monsters, state.grid)
  allEvents.push(...predationResult.events)

  // 5. Process nutrient absorption/release for Nijirigoke (before life decrease)
  const nutrientResult = processNutrientInteractions(predationResult.monsters, predationResult.grid)
  allEvents.push(...nutrientResult.events)

  // 6. Decrease life for moved monsters (and release nutrients on death)
  const lifeResult = decreaseLifeForMoved(
    nutrientResult.monsters,
    originalPositions,
    nutrientResult.grid
  )
  allEvents.push(...lifeResult.events)

  // 7. Process phase transitions (after life decrease/death)
  const phaseState: GameState = {
    ...state,
    grid: lifeResult.grid,
    monsters: lifeResult.monsters,
  }
  const phaseResult = processPhaseTransitions(phaseState)
  allEvents.push(...phaseResult.events)

  // === Hero processing (steps 9-12) ===
  let currentHeroes = [...state.heroes]
  let currentGrid = phaseResult.grid
  let currentMonsters = phaseResult.monsters
  let currentHeroSpawnConfig = state.heroSpawnConfig
  let currentNextHeroId = state.nextHeroId

  // 9. Process hero spawns
  const spawnState: GameState = {
    ...state,
    grid: currentGrid,
    monsters: currentMonsters,
    heroes: currentHeroes,
    heroSpawnConfig: currentHeroSpawnConfig,
    nextHeroId: currentNextHeroId,
  }
  const spawnResult = processHeroSpawns(spawnState, randomFn)
  currentHeroes = [...currentHeroes, ...spawnResult.heroes]
  currentHeroSpawnConfig = spawnResult.heroSpawnConfig
  currentNextHeroId = spawnResult.nextHeroId
  allEvents.push(...spawnResult.events)

  // 10. Calculate hero AI moves
  const movedHeroes: typeof currentHeroes = []
  for (const hero of currentHeroes) {
    if (hero.state === 'dead') {
      continue
    }
    const moveState: GameState = {
      ...state,
      grid: currentGrid,
      monsters: currentMonsters,
      heroes: currentHeroes,
      entrancePosition: state.entrancePosition,
      demonLordPosition: state.demonLordPosition,
    }
    const moveResult = calculateHeroMove(hero, moveState, randomFn)
    movedHeroes.push(moveResult.hero)
    allEvents.push(...moveResult.events)
  }
  currentHeroes = movedHeroes

  // 10.5 Demon lord follows returning hero (dragged one step behind)
  let currentDemonLordPosition = state.demonLordPosition
  const returningHero = currentHeroes.find((h) => h.targetFound && h.state === 'returning')
  if (returningHero) {
    // Hero's previous position = where hero was before this tick's move
    // After handleReturning pops pathHistory, the hero moved to path's new tail.
    // The hero's previous position is one step ahead on the return path = hero's current pos + 1 in original path.
    // Simplest: use the hero's current position's reverse direction neighbor
    // But most reliable: track the position the hero just left.
    // The hero just moved FROM state's hero position TO returningHero.position
    const prevHero = state.heroes.find((h) => h.id === returningHero.id)
    if (prevHero && (prevHero.position.x !== returningHero.position.x || prevHero.position.y !== returningHero.position.y)) {
      currentDemonLordPosition = prevHero.position
    } else {
      // Hero didn't move (blocked by monster) - keep demon lord at current position
      currentDemonLordPosition = state.demonLordPosition
    }
  }

  // 11. Process combat
  const combatResult = processCombat(currentHeroes, currentMonsters, currentGrid)
  currentHeroes = combatResult.heroes.filter((h) => h.state !== 'dead')
  currentMonsters = combatResult.monsters
  currentGrid = combatResult.grid
  allEvents.push(...combatResult.events)

  // 12. Process hero return check (HERO_ESCAPED already emitted by AI in step 10)
  let isGameOver = false
  for (const hero of currentHeroes) {
    if (
      hero.state === 'returning' &&
      hero.position.x === state.entrancePosition.x &&
      hero.position.y === state.entrancePosition.y
    ) {
      allEvents.push({ type: 'GAME_OVER', reason: 'demon_lord_found' })
      isGameOver = true
      break
    }
  }

  return {
    state: {
      ...state,
      grid: currentGrid,
      monsters: currentMonsters,
      heroes: currentHeroes,
      demonLordPosition: currentDemonLordPosition,
      heroSpawnConfig: currentHeroSpawnConfig,
      nextHeroId: currentNextHeroId,
      gameTime: state.gameTime + 1,
      nextMonsterId: phaseResult.nextMonsterId,
      isGameOver,
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
  const monsterType = getMonsterTypeByNutrient(totalNutrients)
  const config = MONSTER_CONFIGS[monsterType]
  const { id: monsterId, nextMonsterId } = generateMonsterId(state)

  // Life based on nutrients (capped at maxLife)
  const initialLife = Math.min(totalNutrients, config.life)
  // Remaining nutrients after life allocation go to carryingNutrient + surrounding cells
  const nutrientsAfterLife = totalNutrients - initialLife
  const carried = Math.min(nutrientsAfterLife, NUTRIENT_CARRY_CAPACITY)
  const remaining = nutrientsAfterLife - carried

  const newMonster: Monster = {
    id: monsterId,
    type: monsterType,
    position: { ...position },
    direction: (['up', 'down', 'left', 'right'] as const)[Math.floor(randomFn() * 4)],
    pattern: config.pattern,
    phase: INITIAL_PHASE[monsterType],
    phaseTickCounter: 0,
    life: initialLife,
    maxLife: config.life,
    attack: config.attack,
    predationTargets: [...config.predationTargets],
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

/**
 * Create initial game state
 * Includes an initial empty cell at the top center for digging entry point
 */
export interface CreateGameStateOptions {
  demonLordPosition?: Position
}

export function createGameState(
  width: number,
  height: number,
  soilRatio: number = 0.7,
  options: CreateGameStateOptions = {},
): GameState {
  const grid: Cell[][] = []

  // Calculate entry point position (top center, one row below the wall)
  const entryX = Math.floor(width / 2)
  const entryY = 1

  const entrancePosition: Position = { x: Math.floor(width / 2), y: 0 }
  const demonLordPosition: Position | null = options.demonLordPosition ?? null

  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      // Borders are walls
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0, magicAmount: 0 })
      } else if (x === entryX && y === entryY) {
        row.push({ type: 'empty', nutrientAmount: 0, magicAmount: 0 })
      } else if (Math.random() < soilRatio) {
        row.push({ type: 'soil', nutrientAmount: 0, magicAmount: 0 })
      } else {
        row.push({ type: 'empty', nutrientAmount: 0, magicAmount: 0 })
      }
    }
    grid.push(row)
  }

  // Entrance stays as wall (monsters can't enter, heroes spawn directly)
  if (demonLordPosition) {
    grid[demonLordPosition.y][demonLordPosition.x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
  }

  return {
    grid,
    monsters: [],
    heroes: [],
    entrancePosition,
    demonLordPosition,
    heroSpawnConfig: {
      partySize: 1,
      spawnStartTick: HERO_SPAWN_START_TICK,
      spawnInterval: HERO_SPAWN_INTERVAL,
      heroesSpawned: 0,
    },
    totalInitialNutrients: 0,
    digPower: INITIAL_DIG_POWER,
    gameTime: 0,
    nextMonsterId: 0,
    nextHeroId: 0,
    isGameOver: false,
  }
}
