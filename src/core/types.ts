// Position on the grid
export interface Position {
  x: number
  y: number
}

// Movement direction
export type Direction = 'up' | 'down' | 'left' | 'right'

// Movement pattern types (from CEDEC 2008)
export type MovementPattern = 'straight' | 'refraction' | 'stationary'

// Monster types
export type MonsterType = 'nijirigoke' | 'gajigajimushi' | 'lizardman'

// Phase types per monster
export type NijirigokePhase = 'mobile' | 'bud' | 'flower' | 'withered'
export type GajigajimushiPhase = 'larva' | 'pupa' | 'adult'
export type LizardmanPhase = 'normal' | 'nesting' | 'laying' | 'egg'
export type MonsterPhase = NijirigokePhase | GajigajimushiPhase | LizardmanPhase

// Monster entity
export interface Monster {
  id: string
  type: MonsterType
  position: Position
  direction: Direction
  pattern: MovementPattern
  phase: MonsterPhase
  phaseTickCounter: number // Ticks spent in current phase (for pupa/laying/egg duration)
  life: number
  maxLife: number
  attack: number
  predationTargets: MonsterType[]
  carryingNutrient: number // Amount of nutrients being carried (0 = none)
  nestPosition: Position | null // Center of nest (for stationary pattern)
  nestOrientation: 'horizontal' | 'vertical' | null // Nest is 3x2 (horizontal) or 2x3 (vertical)
}

// Cell types
export type CellType = 'soil' | 'empty' | 'wall'

// Grid cell
export interface Cell {
  type: CellType
  nutrientAmount: number
  magicAmount: number // Future: magic resource for second ecosystem
}

// Game state
export interface GameState {
  grid: Cell[][]
  monsters: Monster[]
  totalInitialNutrients: number
  digPower: number
  gameTime: number
  nextMonsterId: number
}

// Game events
export type GameEvent =
  | { type: 'MONSTER_SPAWNED'; monster: Monster }
  | { type: 'MONSTER_DIED'; monster: Monster; cause: 'starvation' | 'predation' | 'pickaxe' }
  | { type: 'MONSTER_ATTACKED'; monsterId: string; damage: number; remainingLife: number }
  | { type: 'PREDATION'; predator: Monster; prey: Monster; position: Position }
  | { type: 'NUTRIENT_ABSORBED'; monster: Monster; amount: number; fromPosition: Position }
  | { type: 'NUTRIENT_RELEASED'; monster: Monster; amount: number; toPosition: Position }
  | { type: 'WORLD_DYING'; remainingNutrients: number }
  | { type: 'PHASE_TRANSITION'; monsterId: string; oldPhase: MonsterPhase; newPhase: MonsterPhase }
  | { type: 'MONSTER_REPRODUCED'; parentId: string; offspringIds: string[]; positions: Position[] }
  | { type: 'EGG_LAID'; parentId: string; eggId: string; position: Position }
  | { type: 'EGG_HATCHED'; offspringId: string; position: Position }
  | { type: 'MOYOMOYO_ATTACK'; attackerId: string; targetId: string; damage: number; position: Position }
