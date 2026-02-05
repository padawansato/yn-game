### Requirement: Dig power resource tracking
GameState SHALL track dig power as a consumable integer resource (`digPower`).

#### Scenario: Initial dig power
- **WHEN** a new game state is created
- **THEN** digPower SHALL be initialized to the configured initial value (default: 100)

### Requirement: Dig power consumption
The dig operation SHALL consume 1 dig power per successful dig.

#### Scenario: Dig consumes dig power
- **WHEN** the player successfully digs a soil block
- **THEN** digPower SHALL decrease by 1

#### Scenario: Failed dig does not consume dig power
- **WHEN** the dig operation fails (e.g., invalid position, not soil, not adjacent to empty)
- **THEN** digPower SHALL remain unchanged

### Requirement: Dig power prerequisite
The dig operation SHALL require sufficient dig power.

#### Scenario: Dig requires dig power
- **WHEN** the player attempts to dig with digPower = 0
- **THEN** the dig SHALL fail with error "insufficient dig power"

#### Scenario: Dig succeeds with positive dig power
- **WHEN** the player attempts to dig a valid soil block with digPower > 0
- **THEN** the dig SHALL proceed normally

### Requirement: Dig power UI display
The game UI SHALL display the current dig power value.

#### Scenario: Dig power visible in status area
- **WHEN** the game is running
- **THEN** the current digPower value SHALL be displayed in the status area

#### Scenario: Dig power updates on dig
- **WHEN** the player successfully digs a block
- **THEN** the displayed digPower SHALL decrease by 1

### Requirement: Dig exhaustion warning
The game UI SHALL indicate when dig power is exhausted.

#### Scenario: Zero dig power warning
- **WHEN** digPower reaches 0
- **THEN** the UI SHALL display a warning indicating digging is no longer possible
