## ADDED Requirements

### Requirement: Nijirigoke reproduction
A withered Nijirigoke SHALL produce offspring by distributing its nutrients among child Nijirigoke.

#### Scenario: Offspring generation
- **WHEN** a Nijirigoke transitions to 'withered' phase
- **THEN** it SHALL produce up to MAX_NIJIRIGOKE_OFFSPRING (default: 5) child Nijirigoke at adjacent empty cells

#### Scenario: Offspring nutrient distribution
- **WHEN** a Nijirigoke reproduces with carryingNutrient = N
- **THEN** N nutrients SHALL be evenly distributed among the offspring (remainder stays in surrounding cells)

#### Scenario: Offspring initial state
- **WHEN** a child Nijirigoke is created from reproduction
- **THEN** it SHALL be in 'mobile' phase with life = a configured initial value and carryingNutrient = its share of parent's nutrients

#### Scenario: Limited spawn space
- **WHEN** a Nijirigoke tries to reproduce but fewer than MAX_NIJIRIGOKE_OFFSPRING adjacent empty cells exist
- **THEN** offspring count SHALL be limited to the number of available adjacent empty cells

#### Scenario: No spawn space
- **WHEN** a Nijirigoke tries to reproduce but no adjacent empty cells exist
- **THEN** the Nijirigoke SHALL die and its nutrients SHALL be released to surrounding cells per conservation law

#### Scenario: Parent removal
- **WHEN** reproduction completes
- **THEN** the parent Nijirigoke SHALL be removed from the game

### Requirement: Gajigajimushi reproduction
An adult Gajigajimushi SHALL produce a larva offspring when nutrition and life conditions are met.

#### Scenario: Reproduction condition
- **WHEN** a Gajigajimushi in 'adult' phase has carryingNutrient >= PUPA_NUTRIENT_THRESHOLD AND life > 10
- **THEN** it SHALL produce 1 larva at an adjacent empty cell
- **NOTE**: Currently reuses PUPA_NUTRIENT_THRESHOLD and hardcoded life threshold. Dedicated GAJI_REPRO_* constants planned for a future change.

#### Scenario: Reproduction cost
- **WHEN** a Gajigajimushi reproduces
- **THEN** the parent's carryingNutrient SHALL decrease by half (floor(carryingNutrient/2)) AND life SHALL decrease by 5

#### Scenario: Offspring initial state
- **WHEN** a Gajigajimushi larva is created from reproduction
- **THEN** it SHALL be in 'larva' phase with configured initial life and carryingNutrient transferred from parent

#### Scenario: No adjacent space
- **WHEN** a Gajigajimushi tries to reproduce but no adjacent empty cells exist
- **THEN** reproduction SHALL be delayed until space becomes available

#### Scenario: Parent survival
- **WHEN** a Gajigajimushi reproduces
- **THEN** the parent SHALL continue to exist (unlike Nijirigoke which dies)

### Requirement: Lizardman reproduction via egg hatching
A Lizardman egg SHALL hatch into a new Lizardman, completing the reproduction cycle.

#### Scenario: Egg hatching creates offspring
- **WHEN** an egg hatches after EGG_HATCH_DURATION ticks
- **THEN** a new Lizardman SHALL be created at the egg's position in 'normal' phase

#### Scenario: Offspring nutrients from egg
- **WHEN** a Lizardman hatches from an egg with carryingNutrient = N
- **THEN** the new Lizardman SHALL have carryingNutrient = N (nutrients transferred from egg)

#### Scenario: Offspring initial life
- **WHEN** a Lizardman hatches
- **THEN** its initial life SHALL be a configured value (independent of egg nutrients)

#### Scenario: Egg removal
- **WHEN** an egg hatches
- **THEN** the egg entity SHALL be removed from the game

### Requirement: Reproduction event emission
The system SHALL emit events for reproduction occurrences.

#### Scenario: Reproduction event
- **WHEN** any monster reproduces
- **THEN** the system SHALL emit a MONSTER_REPRODUCED event with parent ID, offspring IDs, and offspring positions

#### Scenario: Egg laid event
- **WHEN** a Lizardman lays an egg
- **THEN** the system SHALL emit an EGG_LAID event with parent ID and egg position

#### Scenario: Egg hatched event
- **WHEN** an egg hatches
- **THEN** the system SHALL emit an EGG_HATCHED event with offspring ID and position
