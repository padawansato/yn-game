# Nutrient Conservation

## Purpose

養分保存則。ゲーム内の養分総量が常に一定であることを保証するシステム。

## Requirements

### Requirement: Nutrient conservation law
The system SHALL guarantee that the total nutrient quantity (sum of all Cell.nutrientAmount + all Monster.carryingNutrient) remains constant across all game ticks. The only exception is external additions from hero deaths: when a hero dies, HERO_NUTRIENT_DROP nutrients SHALL be added to the surrounding 9 cells, increasing the total nutrient count by that amount.

#### Scenario: Conservation across tick
- **WHEN** a game tick is executed without hero deaths
- **THEN** the total nutrients after the tick SHALL equal the total nutrients before the tick

#### Scenario: Conservation across dig
- **WHEN** the player digs a soil block with N nutrients
- **THEN** the total nutrients after digging SHALL equal the total nutrients before digging

#### Scenario: Conservation across monster death
- **WHEN** a monster with carryingNutrient = N dies
- **THEN** N nutrients SHALL be distributed to surrounding cells, and the total nutrients SHALL remain unchanged

#### Scenario: Conservation across predation
- **WHEN** predation occurs and the prey has carryingNutrient = N
- **THEN** N nutrients SHALL be released to surrounding cells, and the total nutrients SHALL remain unchanged

#### Scenario: Conservation across reproduction
- **WHEN** a monster reproduces and creates offspring
- **THEN** the parent's carryingNutrient SHALL be distributed among offspring, and the total nutrients SHALL remain unchanged

#### Scenario: External addition from hero death
- **WHEN** a hero dies in combat
- **THEN** HERO_NUTRIENT_DROP nutrients SHALL be added to the surrounding 9 cells (following the same distribution logic as monster death), and the total nutrient count SHALL increase by exactly HERO_NUTRIENT_DROP

### Requirement: Empty cells can hold nutrients
Empty cells (type: 'empty') SHALL be capable of holding nutrientAmount as a hidden parameter.

#### Scenario: Empty cell nutrient storage
- **WHEN** nutrients are released at a position where all surrounding cells are empty
- **THEN** the nutrients SHALL be stored in the empty cells' nutrientAmount

#### Scenario: Empty cell nutrient display
- **WHEN** an empty cell has nutrientAmount > 0
- **THEN** the nutrientAmount SHALL NOT be visually displayed to the player (hidden parameter)

#### Scenario: Empty cell nutrient persistence
- **WHEN** an empty cell holds nutrients
- **THEN** the nutrients SHALL persist across ticks until absorbed by a monster or redistributed

### Requirement: Nine-cell nutrient release on death
When a monster dies, its carried nutrients SHALL be distributed across the surrounding 9 cells (8 adjacent + center).

#### Scenario: Death with surrounding cells available
- **WHEN** a monster with carryingNutrient = N dies at position (x, y)
- **THEN** N nutrients SHALL be evenly distributed across up to 9 cells: (x-1,y-1), (x,y-1), (x+1,y-1), (x-1,y), (x,y), (x+1,y), (x-1,y+1), (x,y+1), (x+1,y+1), excluding wall cells

#### Scenario: Death near map edge
- **WHEN** a monster dies near the edge of the map
- **THEN** nutrients SHALL be distributed only to valid non-wall cells within the 9-cell range

#### Scenario: Death surrounded only by walls
- **WHEN** a monster dies and all 9 surrounding cells are walls
- **THEN** nutrients SHALL be stored in the center cell (monster's position) to prevent loss

### Requirement: Nutrient overflow distribution
When adding nutrients to a cell would exceed MAX_NUTRIENT_PER_CELL, the overflow SHALL be distributed to neighboring cells.

#### Scenario: Overflow to neighbors
- **WHEN** adding nutrients to a cell would exceed MAX_NUTRIENT_PER_CELL
- **THEN** the excess SHALL be distributed to adjacent non-wall cells that have remaining capacity

#### Scenario: No overflow capacity available
- **WHEN** overflow distribution finds no cells with remaining capacity
- **THEN** the center cell SHALL accept nutrients above MAX_NUTRIENT_PER_CELL (conservation law takes priority over cell cap)

### Requirement: Nutrient conservation validation
The system SHALL provide a validation function to verify the conservation law holds.

#### Scenario: Validation function
- **WHEN** getTotalNutrients(state) is called
- **THEN** it SHALL return the sum of all Cell.nutrientAmount (including empty cells) + all Monster.carryingNutrient

#### Scenario: Debug assertion
- **WHEN** running in test/debug mode
- **THEN** the system SHALL assert that getTotalNutrients() remains constant after each tick (excluding external additions)
