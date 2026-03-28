## MODIFIED Requirements

### Requirement: Monster type definitions
The system SHALL define three monster types with distinct attributes, movement patterns, and lifecycle phases.

#### Scenario: Nijirigoke (Moss) - Straight type
- **WHEN** a Nijirigoke is created
- **THEN** it SHALL have movementPattern="straight", life=24, canCarryNutrients=true, predationTarget=none, phase="mobile"

#### Scenario: Gajigajimushi (Insect) - Refraction type
- **WHEN** a Gajigajimushi is created
- **THEN** it SHALL have movementPattern="refraction", life=30, attack=3, predationTarget=["nijirigoke", "egg"], phase="larva"

#### Scenario: Lizardman - Stationary type
- **WHEN** a Lizardman is created
- **THEN** it SHALL have movementPattern="stationary", life=80, attack=8, predationTarget=["nijirigoke", "gajigajimushi"], phase="normal"
