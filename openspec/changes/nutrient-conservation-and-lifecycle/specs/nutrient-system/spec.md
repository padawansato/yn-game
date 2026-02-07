## MODIFIED Requirements

### Requirement: Fixed nutrient pool
The system SHALL manage nutrients as internal parameters of all non-wall cells. Nutrients SHALL exist within soil cells and empty cells (as hidden parameters).

#### Scenario: Initial nutrient distribution
- **WHEN** a new game starts
- **THEN** nutrients SHALL be distributed across soil blocks as internal cell parameters (nutrientAmount 0-100)

#### Scenario: Nutrient location constraint
- **WHEN** the game state is validated
- **THEN** nutrients SHALL exist in soil cells (visible) and empty cells (hidden). Wall cells SHALL always have nutrientAmount = 0

#### Scenario: Empty cells can hold nutrients
- **WHEN** a cell is empty type
- **THEN** its nutrientAmount MAY be greater than 0 (hidden parameter, not displayed)

#### Scenario: Wall cells have no nutrients
- **WHEN** a cell is wall type
- **THEN** its nutrientAmount SHALL always be 0

#### Scenario: Nutrient conservation
- **WHEN** any game action occurs (excluding external additions from hero death or item destruction)
- **THEN** the total nutrient amount (sum of all Cell.nutrientAmount + all Monster.carryingNutrient) SHALL remain exactly constant

### Requirement: Digging depletes nutrients
The system SHALL spawn a monster (type based on nutrient level) when digging soil with nutrients. Blocks can only be dug if adjacent to an empty space. Nutrients SHALL be fully conserved during digging.

#### Scenario: Dig constraint
- **WHEN** the player attempts to dig a soil block
- **THEN** the dig SHALL succeed only if the block is adjacent to an empty cell

#### Scenario: Dig soil block with nutrients
- **WHEN** the player digs a soil block with N > 0 nutrients (adjacent to empty)
- **THEN** the soil SHALL become empty, a monster SHALL spawn based on nutrient level, and the monster SHALL receive nutrients from the soil with zero loss

#### Scenario: Monster strength from nutrients
- **WHEN** a monster spawns from soil with N nutrients
- **THEN** its initial life SHALL be min(N, maxLife) AND its initial carryingNutrient SHALL receive any remainder (N - life if N > maxLife), distributed to surrounding cells

#### Scenario: Dig nutrient-poor soil
- **WHEN** the player digs a soil block with 0 nutrients (adjacent to empty)
- **THEN** the soil SHALL become empty but NO monster SHALL spawn

#### Scenario: Initial entry point
- **WHEN** a new game starts
- **THEN** the grid SHALL have an initial empty cell at the top center for digging entry

### Requirement: Monster death releases nutrients
When a monster dies, its carried nutrients SHALL be released to surrounding 9 cells (8 adjacent + center), including empty cells.

#### Scenario: Death nutrient release range
- **WHEN** a monster with N carried nutrients dies
- **THEN** the N nutrients SHALL be distributed evenly across surrounding 9 cells (8 adjacent + center), excluding wall cells

#### Scenario: Death near soil and empty cells
- **WHEN** a monster dies adjacent to both soil and empty cells
- **THEN** nutrients SHALL be distributed to all non-wall cells in the 9-cell range equally

#### Scenario: Death with no adjacent non-wall cells
- **WHEN** a monster dies and all surrounding cells are walls except center
- **THEN** all nutrients SHALL be stored in the center cell (monster's position)

### Requirement: World entropy
The system SHALL track total remaining nutrients.

#### Scenario: Nutrient depletion tracking
- **WHEN** the game state is queried
- **THEN** the total remaining nutrients SHALL be returned (including empty cell nutrients)

#### Scenario: World death condition
- **WHEN** total nutrients fall below minimum threshold
- **THEN** the system SHALL emit a "world dying" event

## REMOVED Requirements

### Requirement: Nutrient depletion on dig (30% loss)
**Reason**: Violates the nutrient conservation law. All nutrients must be preserved during digging.
**Migration**: Remove `NUTRIENT_DEPLETION_RATIO` constant and `depleteOnDig()` function. Soil nutrients are now 100% transferred to spawned monster and surrounding cells.
