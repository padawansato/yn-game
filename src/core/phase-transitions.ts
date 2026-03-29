import type {
  Cell,
  GameEvent,
  GameState,
  Monster,
  Position,
} from './types'
import type { GameConfig } from './config'
import {
  getSurroundingCells,
  releaseNutrientsOnDeath,
} from './nutrient'

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
  events: GameEvent[],
  config: GameConfig
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
      const moyomoyoDamage = config.monsters.nijirigoke.moyomoyoDamage!
      damageMap.set(target.id, prevDamage + moyomoyoDamage)

      events.push({
        type: 'MOYOMOYO_ATTACK',
        attackerId: flower.id,
        targetId: target.id,
        damage: moyomoyoDamage,
        position: { ...target.position },
      })

      // Check if accumulated damage kills the target
      const totalDamage = prevDamage + moyomoyoDamage
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

  const { config } = state

  for (const monster of state.monsters) {
    const result = processMonsterPhase(monster, currentGrid, idCounter, events, newMonsters, config)
    // Filter out dead monsters (life < 0 signals death after reproduction)
    if (result.monster.life >= 0) {
      updatedMonsters.push(result.monster)
    }
    currentGrid = result.grid
  }

  // Apply moyomoyo attacks from flower-phase Nijirigoke
  const allMonsters = [...updatedMonsters, ...newMonsters]
  const moyomoyoResult = applyMoyomoyoAttacks(allMonsters, currentGrid, events, config)

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
  newMonsters: Monster[],
  config: GameConfig
): { monster: Monster; grid: Cell[][] } {
  switch (monster.type) {
    case 'nijirigoke':
      return processNijirigokePhase(monster, grid, idCounter, events, newMonsters, config)
    case 'gajigajimushi':
      return processGajigajimushiPhase(monster, grid, idCounter, events, newMonsters, config)
    case 'lizardman':
      return processLizardmanPhase(monster, grid, idCounter, events, newMonsters, config)
    default:
      return { monster, grid }
  }
}

function processNijirigokePhase(
  monster: Monster,
  grid: Cell[][],
  idCounter: IdCounter,
  events: GameEvent[],
  newMonsters: Monster[],
  config: GameConfig
): { monster: Monster; grid: Cell[][] } {
  const nijiConfig = config.monsters.nijirigoke
  const phase = monster.phase

  // mobile → bud
  if (
    phase === 'mobile' &&
    monster.carryingNutrient >= nijiConfig.budNutrientThreshold!
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
  if (phase === 'bud' && monster.carryingNutrient >= nijiConfig.flowerNutrientThreshold!) {
    events.push({
      type: 'PHASE_TRANSITION',
      monsterId: monster.id,
      oldPhase: 'bud',
      newPhase: 'flower',
    })
    return { monster: { ...monster, phase: 'flower', phaseTickCounter: 0 }, grid }
  }

  // flower: life drain at normal rate + transition to withered
  if (phase === 'flower') {
    const newLife = monster.life - config.movement.lifeCost
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
          life: nijiConfig.life,
          maxLife: nijiConfig.life,
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
  newMonsters: Monster[],
  config: GameConfig
): { monster: Monster; grid: Cell[][] } {
  const gajiConfig = config.monsters.gajigajimushi
  const phase = monster.phase

  // larva → pupa (requires nutrients + at least 2 adjacent empty cells)
  if (phase === 'larva' && monster.carryingNutrient >= gajiConfig.pupaNutrientThreshold!) {
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
    if (newCounter >= gajiConfig.pupaDuration!) {
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
    monster.carryingNutrient >= gajiConfig.pupaNutrientThreshold! &&
    monster.life > gajiConfig.reproLifeThreshold!
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
        life: gajiConfig.life,
        maxLife: gajiConfig.life,
        attack: gajiConfig.attack,
        predationTargets: [...gajiConfig.predationTargets],
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
          life: monster.life - gajiConfig.reproLifeCost!,
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
  newMonsters: Monster[],
  config: GameConfig
): { monster: Monster; grid: Cell[][] } {
  const lizConfig = config.monsters.lizardman
  const phase = monster.phase

  // normal/nesting → laying (must be at nest center)
  if (
    (phase === 'normal' || phase === 'nesting') &&
    monster.nestPosition &&
    monster.nestOrientation &&
    monster.position.x === monster.nestPosition.x &&
    monster.position.y === monster.nestPosition.y &&
    monster.carryingNutrient >= lizConfig.layingNutrientThreshold! &&
    monster.life >= lizConfig.layingLifeThreshold!
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
    if (newCounter >= lizConfig.layingDuration!) {
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
    if (newCounter >= lizConfig.eggHatchDuration!) {
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
          life: lizConfig.life,
          maxLife: lizConfig.life,
          attack: lizConfig.attack,
          predationTargets: [...lizConfig.predationTargets],
        },
        grid,
      }
    }
    return { monster: { ...monster, phaseTickCounter: newCounter }, grid }
  }

  return { monster, grid }
}
