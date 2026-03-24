## MODIFIED Requirements

### Requirement: Prey removal
The system SHALL remove prey from the game when eaten, and release nutrients per the conservation law.

#### Scenario: Prey death
- **WHEN** predation occurs
- **THEN** the prey SHALL be immediately removed from the grid

#### Scenario: Nutrient release on predation
- **WHEN** a monster carrying nutrients is eaten
- **THEN** the nutrients SHALL be distributed to surrounding 9 cells (8 adjacent + center), excluding wall cells, following the conservation law

### Requirement: Predation hierarchy
The system SHALL enforce a strict predation hierarchy including egg vulnerability.

#### Scenario: Gajigajimushi predation targets
- **WHEN** a Gajigajimushi contacts a Nijirigoke or an egg
- **THEN** it SHALL predate the target

#### Scenario: Lizardman predation targets
- **WHEN** a Lizardman contacts a Nijirigoke or Gajigajimushi
- **THEN** it SHALL predate the target

#### Scenario: Egg vulnerability
- **WHEN** a Gajigajimushi contacts a Lizardman egg
- **THEN** it SHALL predate the egg

#### Scenario: Invalid predation
- **WHEN** a monster contacts a non-prey entity
- **THEN** no predation SHALL occur

#### Scenario: Immobile phase predation
- **WHEN** a predator enters a cell containing an immobile monster (bud, pupa, egg)
- **THEN** predation SHALL occur if the immobile monster is a valid prey target
