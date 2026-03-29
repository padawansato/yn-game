import type {
  GameEvent,
  GameState,
  Position,
} from './types'
import { calculateAllMoves, resolveConflicts, applyMovements } from './movement-resolution'
import { processNestEstablishment, processNutrientInteractions, decreaseLifeForMoved } from './life-cycle'
import { processPhaseTransitions } from './phase-transitions'
import { processPredation } from './predation'
import { processHeroSpawns, calculateHeroMove } from './hero'
import { processCombat } from './combat'

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
  const nestResult = processNestEstablishment(moveResult.monsters, originalNestPositions, state.config)
  allEvents.push(...nestResult.events)

  // 4. Process predation (same cell)
  const predationResult = processPredation(nestResult.monsters, state.grid)
  allEvents.push(...predationResult.events)

  // 5. Process nutrient absorption/release for Nijirigoke (before life decrease)
  const nutrientResult = processNutrientInteractions(predationResult.monsters, predationResult.grid, state.config)
  allEvents.push(...nutrientResult.events)

  // 6. Decrease life for moved monsters (and release nutrients on death)
  const lifeResult = decreaseLifeForMoved(
    nutrientResult.monsters,
    originalPositions,
    nutrientResult.grid,
    state.config
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
    const heroMoveResult = calculateHeroMove(hero, moveState, randomFn)
    movedHeroes.push(heroMoveResult.hero)
    allEvents.push(...heroMoveResult.events)
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
  const combatResult = processCombat(currentHeroes, currentMonsters, currentGrid, state.config)
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
