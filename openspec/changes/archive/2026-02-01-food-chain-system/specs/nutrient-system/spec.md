## ADDED Requirements

### Requirement: Fixed nutrient pool
The system SHALL initialize a fixed amount of nutrients at game start. Nutrients SHALL NOT increase during gameplay.

#### Scenario: Initial nutrient distribution
- **WHEN** a new game starts
- **THEN** nutrients SHALL be distributed across soil blocks with a fixed total amount

#### Scenario: Nutrient conservation
- **WHEN** any game action occurs (digging, monster movement, predation)
- **THEN** the total nutrient amount in the system SHALL remain constant or decrease, never increase

### Requirement: Digging depletes nutrients
The system SHALL remove nutrients from the world when a soil block is dug.

#### Scenario: Dig soil block with nutrients
- **WHEN** the player digs a soil block containing nutrients
- **THEN** the soil block SHALL be destroyed and its nutrients SHALL be partially lost (not fully transferred)

#### Scenario: Nutrient loss ratio
- **WHEN** a soil block with N nutrients is dug
- **THEN** only 70% of N SHALL be available for the spawned Nijirigoke, 30% is lost forever

### Requirement: Moss carries nutrients
Nijirigoke (moss) SHALL be the only entity that transports nutrients.

#### Scenario: Nijirigoke picks up nutrient
- **WHEN** a Nijirigoke without nutrients encounters a nutrient deposit
- **THEN** it SHALL pick up the nutrient

#### Scenario: Nijirigoke deposits nutrient
- **WHEN** a Nijirigoke carrying nutrients encounters an empty valid cell
- **THEN** it SHALL deposit the nutrient

### Requirement: World entropy
The system SHALL track total remaining nutrients. The world inevitably trends toward depletion.

#### Scenario: Nutrient depletion tracking
- **WHEN** the game state is queried
- **THEN** the total remaining nutrients SHALL be returned

#### Scenario: World death condition
- **WHEN** total nutrients fall below minimum threshold
- **THEN** the system SHALL emit a "world dying" event
