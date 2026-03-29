// Re-export all public functions and types for backward compatibility
export { calculateAllMoves, resolveConflicts, applyMovements } from './movement-resolution'
export type { PlannedMove } from './movement-resolution'
export { processNestEstablishment, processNutrientInteractions, decreaseLifeForMoved } from './life-cycle'
export { processPhaseTransitions, applyMoyomoyoAttacks } from './phase-transitions'
export { dig, attackMonster, isAdjacentToEmpty } from './dig'
export { createGameState, generateMonsterId } from './spawn'
export type { CreateGameStateOptions } from './spawn'
export { tick } from './tick'
