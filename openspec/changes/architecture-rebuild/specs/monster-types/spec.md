## MODIFIED Requirements

### Requirement: Monster type definitions
The system SHALL define monster types via GameConfig.monsters (Record<string, MonsterTypeConfig>) instead of hardcoded constants. Default config SHALL provide the three standard types (nijirigoke, gajigajimushi, lizardman) with current values.

#### Scenario: Nijirigoke (Moss) - Straight type
- **WHEN** a Nijirigoke is created using default config
- **THEN** it SHALL have movementPattern="straight", life=24, canCarryNutrients=true, predationTarget=none, phase="mobile"

#### Scenario: Gajigajimushi (Insect) - Refraction type
- **WHEN** a Gajigajimushi is created using default config
- **THEN** it SHALL have movementPattern="refraction", life=30, attack=3, predationTarget=["nijirigoke", "egg"], phase="larva"

#### Scenario: Lizardman - Stationary type
- **WHEN** a Lizardman is created using default config
- **THEN** it SHALL have movementPattern="stationary", life=120, attack=15, predationTarget=["nijirigoke", "gajigajimushi"], phase="normal"

#### Scenario: Custom monster type
- **WHEN** a user adds a new entry to GameConfig.monsters with custom values
- **THEN** the system SHALL use those values for spawning, movement, predation, and lifecycle

#### Scenario: Monster parameters from config
- **WHEN** any game function needs monster parameters (life, attack, etc.)
- **THEN** it SHALL read from state.config.monsters[type] instead of importing from constants.ts
