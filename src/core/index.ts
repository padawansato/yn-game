// Types
export type {
  Position,
  Direction,
  MovementPattern,
  MonsterType,
  NijirigokePhase,
  GajigajimushiPhase,
  LizardmanPhase,
  MonsterPhase,
  Monster,
  CellType,
  Cell,
  GameState,
  GameEvent,
} from './types'

// Config
export { createDefaultConfig, validateConfig } from './config'
export type { GameConfig, MonsterTypeConfig, ConfigValidationError } from './config'

// Nutrient system
export {
  initializeNutrients,
  getTotalNutrients,
  isWorldDying,
  exponentialRandom,
  getAdjacentSoilCells,
  getSurroundingCells,
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
  getNestCells,
} from './movement'
export type { MoveResult } from './movement'

// Predation
export { canPredate, checkSameCellPredation, applyPredation, processPredation } from './predation'
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
  attackMonster,
  processPhaseTransitions,
  processNestEstablishment,
  applyMoyomoyoAttacks,
} from './simulation'

// Game Loop
export { GameLoop } from './game-loop'
export type { TickCallback } from './game-loop'

// Random
export { createSeededRandom } from './random'
