## ADDED Requirements

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

### Requirement: Life decreases with movement
Monsters SHALL lose life when performing movement actions, unless their current phase exempts them.

#### Scenario: Movement life cost
- **WHEN** a monster in a mobile phase moves one cell
- **THEN** its life SHALL decrease by 1

#### Scenario: Immobile phase exemption
- **WHEN** a monster is in an immobile phase (bud, flower, pupa, laying, egg)
- **THEN** it SHALL NOT incur movement life cost

#### Scenario: Death by starvation
- **WHEN** a monster's life reaches 0
- **THEN** it SHALL die and be removed from the grid (triggering nutrient release per conservation law)

### Requirement: Hunger state
Monsters in mobile phases SHALL enter hunger state when life drops below threshold.

#### Scenario: Hunger threshold
- **WHEN** a monster in a mobile phase has life below 30% of max life
- **THEN** it SHALL enter "hungry" state

#### Scenario: Hungry behavior
- **WHEN** a monster is in hungry state
- **THEN** its movement AI SHALL prioritize directions where prey exists

#### Scenario: Immobile phase hunger
- **WHEN** a monster is in an immobile phase (bud, pupa, laying, egg)
- **THEN** hunger state SHALL NOT apply

### Requirement: Monster spawning from dig
The system SHALL spawn Nijirigoke when player digs soil.

#### Scenario: Dig spawns Nijirigoke
- **WHEN** the player digs a soil block
- **THEN** a Nijirigoke SHALL spawn at that position with life based on nutrient content

#### Scenario: Cannot dig non-soil
- **WHEN** the player attempts to dig a non-soil cell
- **THEN** the action SHALL be rejected
