## ADDED Requirements

### Requirement: Monster type definitions
The system SHALL define three monster types with distinct attributes and movement patterns.

#### Scenario: Nijirigoke (Moss) - Straight type
- **WHEN** a Nijirigoke is created
- **THEN** it SHALL have movementPattern="straight", life=10, canCarryNutrients=true, predationTarget=none

#### Scenario: Gajigajimushi (Insect) - Refraction type
- **WHEN** a Gajigajimushi is created
- **THEN** it SHALL have movementPattern="refraction", life=30, attack=3, predationTarget=["nijirigoke", "egg"]

#### Scenario: Lizardman - Stationary type
- **WHEN** a Lizardman is created
- **THEN** it SHALL have movementPattern="stationary", life=80, attack=8, predationTarget=["nijirigoke", "gajigajimushi"]

### Requirement: Life decreases with movement
Every monster SHALL lose life when performing movement actions.

#### Scenario: Movement life cost
- **WHEN** a monster moves one cell
- **THEN** its life SHALL decrease by 1

#### Scenario: Death by starvation
- **WHEN** a monster's life reaches 0
- **THEN** it SHALL die and be removed from the grid

### Requirement: Hunger state
Monsters SHALL enter hunger state when life drops below threshold.

#### Scenario: Hunger threshold
- **WHEN** a monster's life falls below 30% of max life
- **THEN** it SHALL enter "hungry" state

#### Scenario: Hungry behavior
- **WHEN** a monster is in hungry state
- **THEN** its movement AI SHALL prioritize directions where prey exists

### Requirement: Monster spawning from dig
The system SHALL spawn Nijirigoke when player digs soil.

#### Scenario: Dig spawns Nijirigoke
- **WHEN** the player digs a soil block
- **THEN** a Nijirigoke SHALL spawn at that position with life based on nutrient content

#### Scenario: Cannot dig non-soil
- **WHEN** the player attempts to dig a non-soil cell
- **THEN** the action SHALL be rejected
