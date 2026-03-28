## ADDED Requirements

### Requirement: Predation on contact
The system SHALL trigger predation when predator and prey occupy the same cell.

#### Scenario: Same cell predation
- **WHEN** a predator enters a cell containing its prey
- **THEN** predation SHALL occur immediately

#### Scenario: Prey enters predator cell
- **WHEN** a prey enters a cell containing its predator
- **THEN** predation SHALL occur immediately

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

### Requirement: Life recovery from predation
Predators SHALL recover life when eating prey.

#### Scenario: Life recovery amount
- **WHEN** a predator eats prey
- **THEN** the predator's life SHALL increase by the prey's remaining life value

#### Scenario: Life cap
- **WHEN** predation would increase life above maximum
- **THEN** life SHALL be capped at the monster's maximum life value

### Requirement: Prey removal and nutrient transfer
The system SHALL remove prey from the game when eaten, and transfer its carried nutrients to the predator.

#### Scenario: Prey death
- **WHEN** predation occurs
- **THEN** the prey SHALL be immediately removed from the grid

#### Scenario: Nutrient transfer to predator
- **WHEN** a monster carrying nutrients is eaten
- **THEN** the prey's carryingNutrient SHALL be added to the predator's carryingNutrient (nutrients are transferred, not released to grid)

### Requirement: Predation event emission
The system SHALL emit events for predation occurrences.

#### Scenario: Predation event
- **WHEN** predation occurs
- **THEN** the system SHALL emit an event with predator type, prey type, and position

#### Scenario: Food chain break detection
- **WHEN** a prey species population reaches 0
- **THEN** the system SHALL emit a "food chain broken" warning event
