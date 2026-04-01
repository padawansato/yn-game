## ADDED Requirements

### Requirement: Hero entity definition
The system SHALL support a Hero entity type, distinct from Monster, with the following properties: id, position, direction, life, maxLife, attack, attackPattern, visitedCells, pathHistory, state, and targetFound.

#### Scenario: Hero entity creation
- **WHEN** a hero is created
- **THEN** the hero SHALL have a unique id (format: `hero-N`), position at the entrance, a random initial direction, life equal to maxLife, attackPattern of 'slash', an empty visitedCells set, an empty pathHistory array, state of 'exploring', and targetFound of false

#### Scenario: Hero state transitions
- **WHEN** a hero finds the demon lord flag
- **THEN** the hero's state SHALL transition from 'exploring' to 'returning' and targetFound SHALL be set to true

#### Scenario: Hero death
- **WHEN** a hero's life reaches 0 or below
- **THEN** the hero's state SHALL transition to 'dead' and the hero SHALL be removed from active heroes

### Requirement: Hero attack pattern
The system SHALL support typed attack patterns for heroes. The initial pattern is 'slash' (melee attack to the front cell).

#### Scenario: Slash attack pattern
- **WHEN** a hero has attackPattern 'slash'
- **THEN** the hero SHALL attack the monster in the cell directly in front of the hero's facing direction

### Requirement: Hero default stats
The system SHALL define hero stats as tunable constants: HERO_LIFE, HERO_ATTACK.

#### Scenario: Default hero configuration
- **WHEN** a hero is spawned with default configuration
- **THEN** the hero SHALL have life and maxLife equal to HERO_LIFE, and attack equal to HERO_ATTACK
