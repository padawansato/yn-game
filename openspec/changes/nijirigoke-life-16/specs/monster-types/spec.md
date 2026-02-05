## MODIFIED Requirements

### Requirement: Monster type definitions
The system SHALL define three monster types with distinct attributes and movement patterns.

#### Scenario: Nijirigoke (Moss) - Straight type
- **WHEN** a Nijirigoke is created
- **THEN** it SHALL have movementPattern="straight", life=16, canCarryNutrients=true, predationTarget=none

#### Scenario: Gajigajimushi (Insect) - Refraction type
- **WHEN** a Gajigajimushi is created
- **THEN** it SHALL have movementPattern="refraction", life=30, attack=3, predationTarget=["nijirigoke", "egg"]

#### Scenario: Lizardman - Stationary type
- **WHEN** a Lizardman is created
- **THEN** it SHALL have movementPattern="stationary", life=80, attack=8, predationTarget=["nijirigoke", "gajigajimushi"]
