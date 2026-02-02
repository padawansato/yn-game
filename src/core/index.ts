// Types
export type {
  Position,
  Direction,
  MovementPattern,
  MonsterType,
  Monster,
  Nutrient,
  CellType,
  Cell,
  GameState,
  GameEvent,
} from './types'

// Constants
export {
  MONSTER_CONFIGS,
  NUTRIENT_DEPLETION_RATIO,
  HUNGER_THRESHOLD_RATIO,
  MOVEMENT_LIFE_COST,
  DEFAULT_GRID_WIDTH,
  DEFAULT_GRID_HEIGHT,
} from './constants'
export type { MonsterConfig } from './constants'

// Nutrient system
export {
  initializeNutrients,
  depleteOnDig,
  pickupNutrient,
  depositNutrient,
  getTotalNutrients,
  isWorldDying,
  generateNutrientId,
  resetNutrientIdCounter,
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
  calculateAllMoves,
  resolveConflicts,
  applyMovements,
  decreaseLifeForMoved,
  createGameState,
  generateMonsterId,
  resetMonsterIdCounter,
} from './simulation'
