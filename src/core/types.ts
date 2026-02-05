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

// Monster entity
export interface Monster {
  id: string
  type: MonsterType
  position: Position
  direction: Direction
  pattern: MovementPattern
  life: number
  maxLife: number
  attack: number
  predationTargets: MonsterType[]
  carryingNutrient: number // Amount of nutrients being carried (0 = none)
  nestPosition: Position | null // For stationary pattern
}

// Cell types
export type CellType = 'soil' | 'empty' | 'wall'

// Grid cell
export interface Cell {
  type: CellType
  nutrientAmount: number
}

// Game state
export interface GameState {
  grid: Cell[][]
  monsters: Monster[]
  totalInitialNutrients: number
  digPower: number
}

// Game events
export type GameEvent =
  | { type: 'MONSTER_SPAWNED'; monster: Monster }
  | { type: 'MONSTER_DIED'; monster: Monster; cause: 'starvation' | 'predation' }
  | { type: 'PREDATION'; predator: Monster; prey: Monster; position: Position }
  | { type: 'NUTRIENT_ABSORBED'; monster: Monster; amount: number; fromPosition: Position }
  | { type: 'NUTRIENT_RELEASED'; monster: Monster; amount: number; toPosition: Position }
  | { type: 'WORLD_DYING'; remainingNutrients: number }
