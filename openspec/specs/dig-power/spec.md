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
