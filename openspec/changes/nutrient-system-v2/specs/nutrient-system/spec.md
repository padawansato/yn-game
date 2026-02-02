## MODIFIED Requirements

### Requirement: Fixed nutrient pool
The system SHALL initialize a fixed amount of nutrients at game start. Nutrients SHALL NOT increase during gameplay. Nutrients SHALL exist in two forms: embedded in soil blocks (0-100 scale per cell) and released as entities (after digging).

#### Scenario: Initial nutrient distribution
- **WHEN** a new game starts
- **THEN** nutrients SHALL be distributed across soil blocks with a sparse, non-uniform distribution where each soil cell has 0-100 nutrient amount

#### Scenario: Sparse distribution pattern
- **WHEN** initial nutrients are distributed
- **THEN** the distribution SHALL follow an exponential-like pattern where most cells have low nutrients and few cells have high nutrients

#### Scenario: Initial nutrient density limit
- **WHEN** a new game starts with default settings
- **THEN** the total initial nutrients SHALL be calibrated so that Gajigajimushi can spawn but Lizardman cannot spawn from a single dig

#### Scenario: Nutrient conservation
- **WHEN** any game action occurs (digging, monster movement, predation)
- **THEN** the total nutrient amount in the system SHALL remain constant or decrease, never increase

### Requirement: Digging depletes nutrients
The system SHALL remove nutrients from the world when a soil block is dug. Digging SHALL convert embedded soil nutrients into released nutrient entities.

#### Scenario: Dig soil block with nutrients
- **WHEN** the player digs a soil block containing nutrients
- **THEN** the soil block SHALL be destroyed and 70% of its embedded nutrients SHALL be converted to a released nutrient entity

#### Scenario: Nutrient loss ratio
- **WHEN** a soil block with N nutrients is dug
- **THEN** only 70% of N SHALL be available for the spawned Nijirigoke, 30% is lost forever

#### Scenario: Dig soil block with zero nutrients
- **WHEN** the player digs a soil block with 0 nutrients
- **THEN** the soil block SHALL be destroyed but no nutrient entity SHALL be created

## ADDED Requirements

### Requirement: Nutrient location constraints
Nutrients SHALL only exist in valid locations based on their form.

#### Scenario: Embedded nutrients in soil only
- **WHEN** the game state is validated
- **THEN** embedded nutrients (Cell.nutrientAmount > 0) SHALL only exist in soil cells, never in empty or wall cells

#### Scenario: Released nutrients in empty cells only
- **WHEN** a nutrient entity exists
- **THEN** it SHALL only be positioned in empty cells, never in soil or wall cells

#### Scenario: Nutrient entity creation location
- **WHEN** a soil block is dug and converts to empty
- **THEN** the released nutrient entity SHALL be created at that newly empty cell position

### Requirement: Nutrient amount scale
Soil cells SHALL store nutrient amounts on a 0-100 scale representing nutrient density percentage.

#### Scenario: Nutrient scale bounds
- **WHEN** a soil cell is initialized or modified
- **THEN** its nutrientAmount SHALL be an integer between 0 and 100 inclusive

#### Scenario: Zero nutrient soil
- **WHEN** a soil cell has nutrientAmount of 0
- **THEN** digging it SHALL NOT create a nutrient entity and SHALL spawn a Nijirigoke with minimal life
