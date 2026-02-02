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
  carryingNutrient: string | null // Nutrient ID or null
  nestPosition: Position | null // For stationary pattern
}

// Nutrient entity
export interface Nutrient {
  id: string
  position: Position
  amount: number
  carriedBy: string | null // Monster ID or null if on ground
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
  nutrients: Nutrient[]
  totalInitialNutrients: number
}

// Game events
export type GameEvent =
  | { type: 'MONSTER_SPAWNED'; monster: Monster }
  | { type: 'MONSTER_DIED'; monster: Monster; cause: 'starvation' | 'predation' }
  | { type: 'PREDATION'; predator: Monster; prey: Monster; position: Position }
  | { type: 'NUTRIENT_PICKED'; monster: Monster; nutrient: Nutrient }
  | { type: 'NUTRIENT_DROPPED'; monster: Monster; nutrient: Nutrient }
  | { type: 'WORLD_DYING'; remainingNutrients: number }
