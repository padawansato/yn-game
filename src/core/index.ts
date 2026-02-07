// Types
export type {
  Position,
  Direction,
  MovementPattern,
  MonsterType,
  Monster,
  CellType,
  Cell,
  GameState,
  GameEvent,
} from './types'

// Constants
export {
  MONSTER_CONFIGS,
  NUTRIENT_DEPLETION_RATIO,
  NUTRIENT_CARRY_CAPACITY,
  NUTRIENT_RELEASE_THRESHOLD,
  HUNGER_THRESHOLD_RATIO,
  MOVEMENT_LIFE_COST,
  DEFAULT_GRID_WIDTH,
  DEFAULT_GRID_HEIGHT,
  MAX_NUTRIENT_PER_CELL,
} from './constants'
export type { MonsterConfig } from './constants'

// Nutrient system
export {
  initializeNutrients,
  depleteOnDig,
  getTotalNutrients,
  isWorldDying,
  exponentialRandom,
  getAdjacentSoilCells,
  absorbNutrient,
  releaseNutrient,
  releaseNutrientsOnDeath,
} from './nutrient'

// Movement
export {
  calculateMove,
  isHungry,
  detectPrey,
  prioritizePreyDirection,
  getForwardPosition,
  isValidMove,
  getTurnDirections,
  calculateStraightMove,
  calculateRefractionMove,
  calculateStationaryMove,
} from './movement'
export type { MoveResult } from './movement'

// Predation
export {
  canPredate,
  checkSameCellPredation,
  applyPredation,
  processPredation,
} from './predation'
export type { PredationResult } from './predation'

// Simulation
export {
  tick,
  dig,
  isAdjacentToEmpty,
  calculateAllMoves,
  resolveConflicts,
  applyMovements,
  decreaseLifeForMoved,
  processNutrientInteractions,
  createGameState,
  generateMonsterId,
} from './simulation'

// Game Loop
export { GameLoop } from './game-loop'
export type { TickCallback } from './game-loop'
