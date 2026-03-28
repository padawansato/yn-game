# Monster Lifecycle

## Purpose

モンスターのライフサイクル（フェーズ遷移）システム。各モンスターは種別ごとに異なるフェーズを持ち、条件に応じて遷移する。

## Requirements

### Requirement: Monster phase system
Each monster SHALL have a phase field representing its current lifecycle stage. The valid phases depend on the monster's type.

#### Scenario: Nijirigoke phases
- **WHEN** a Nijirigoke exists in the game
- **THEN** its phase SHALL be one of: 'mobile', 'bud', 'flower', 'withered'

#### Scenario: Gajigajimushi phases
- **WHEN** a Gajigajimushi exists in the game
- **THEN** its phase SHALL be one of: 'larva', 'pupa', 'adult'

#### Scenario: Lizardman phases
- **WHEN** a Lizardman exists in the game
- **THEN** its phase SHALL be one of: 'normal', 'nesting', 'laying', 'egg'

#### Scenario: Initial phase on spawn
- **WHEN** a monster is spawned from digging
- **THEN** it SHALL be in its initial phase: Nijirigoke='mobile', Gajigajimushi='larva', Lizardman='normal'

### Requirement: Nijirigoke lifecycle - bud transition
A Nijirigoke SHALL transition from 'mobile' to 'bud' when it has accumulated sufficient nutrients (nutrient-only trigger, no life condition).

#### Scenario: Bud transition condition
- **WHEN** a Nijirigoke has carryingNutrient >= BUD_NUTRIENT_THRESHOLD (4)
- **THEN** it SHALL transition to 'bud' phase

#### Scenario: Bud immobility
- **WHEN** a Nijirigoke is in 'bud' phase
- **THEN** it SHALL NOT move (fixed position)

#### Scenario: Bud absorption range
- **WHEN** a Nijirigoke is in 'bud' phase
- **THEN** it SHALL absorb nutrients from surrounding 9 cells (8 adjacent + center), not just 4 directional cells

### Requirement: Nijirigoke lifecycle - flower transition
A Nijirigoke bud SHALL transition to 'flower' when it accumulates enough nutrients.

#### Scenario: Flower transition condition
- **WHEN** a Nijirigoke in 'bud' phase reaches carryingNutrient >= FLOWER_NUTRIENT_THRESHOLD
- **THEN** it SHALL transition to 'flower' phase

#### Scenario: Flower immobility
- **WHEN** a Nijirigoke is in 'flower' phase
- **THEN** it SHALL NOT move (fixed position)

#### Scenario: Flower attack capability
- **WHEN** a Nijirigoke is in 'flower' phase during a tick
- **THEN** it SHALL deal MOYOMOYO_DAMAGE (2) to all gajigajimushi within surrounding 9 cells (8 adjacent + center)
- **AND** a MOYOMOYO_ATTACK event SHALL be emitted for each hit
- **AND** if a target's life reaches 0 or below, it SHALL die and release nutrients per conservation law

#### Scenario: Flower life decay
- **WHEN** a Nijirigoke is in 'flower' phase
- **THEN** its life SHALL decrease by MOVEMENT_LIFE_COST (1) each tick (same rate as normal movement)

### Requirement: Nijirigoke lifecycle - withered transition
A flower Nijirigoke SHALL transition to 'withered' when its life reaches 0.

#### Scenario: Withered transition
- **WHEN** a Nijirigoke in 'flower' phase has life <= 0
- **THEN** it SHALL transition to 'withered' phase and trigger reproduction

### Requirement: Gajigajimushi lifecycle - pupa transition
A Gajigajimushi SHALL transition from 'larva' to 'pupa' when nutrition conditions are met and surrounding space is available.

#### Scenario: Pupa transition condition
- **WHEN** a Gajigajimushi in 'larva' phase has carryingNutrient >= PUPA_NUTRIENT_THRESHOLD AND at least 2 adjacent empty cells exist
- **THEN** it SHALL transition to 'pupa' phase

#### Scenario: Pupa immobility
- **WHEN** a Gajigajimushi is in 'pupa' phase
- **THEN** it SHALL NOT move and SHALL NOT consume life or nutrients per tick

#### Scenario: Pupa duration
- **WHEN** a Gajigajimushi enters 'pupa' phase
- **THEN** it SHALL remain in pupa for PUPA_DURATION ticks before transitioning to 'adult'

### Requirement: Gajigajimushi lifecycle - adult transition
A Gajigajimushi pupa SHALL transition to 'adult' (winged form) after the pupa duration.

#### Scenario: Adult transition
- **WHEN** a Gajigajimushi has been in 'pupa' phase for PUPA_DURATION ticks
- **THEN** it SHALL transition to 'adult' phase

#### Scenario: Adult movement
- **WHEN** a Gajigajimushi is in 'adult' phase
- **THEN** it SHALL move using the refraction pattern (same as larva)

#### Scenario: Adult predation
- **WHEN** a Gajigajimushi is in 'adult' phase
- **THEN** it SHALL retain the same predation targets as in larva phase

### Requirement: Lizardman nest construction
A Lizardman SHALL construct a nest when it finds a suitable open space.

#### Scenario: Nest space requirement
- **WHEN** a Lizardman is at a position where a contiguous 2x3 or 3x2 empty space exists containing that position
- **THEN** it SHALL establish a nest, recording the nest area (6 cells)

#### Scenario: Nest cost
- **WHEN** a Lizardman builds a nest
- **THEN** it SHALL consume NEST_NUTRIENT_COST (14) nutrients and NEST_LIFE_COST (2) life

#### Scenario: Nest affordability
- **WHEN** a Lizardman has carryingNutrient < NEST_NUTRIENT_COST OR life <= NEST_LIFE_COST
- **THEN** it SHALL NOT establish a nest and SHALL continue using straight movement fallback

#### Scenario: Shared nests
- **WHEN** a Lizardman cannot afford to build its own nest (insufficient nutrients or life)
- **AND** another Lizardman already has a nest established
- **THEN** it SHALL adopt that nest (copy nestPosition and nestOrientation) at no cost
- **AND** the Lizardman SHALL prefer building its own nest when affordable

### Requirement: Lizardman lifecycle - laying transition
A Lizardman with a nest SHALL transition to 'laying' when nutrition conditions are met.

#### Scenario: Laying transition condition
- **WHEN** a Lizardman in 'normal' or 'nesting' phase is within its nest area AND has carryingNutrient >= LAYING_NUTRIENT_THRESHOLD AND life >= LAYING_LIFE_THRESHOLD
- **THEN** it SHALL move to the nest center and transition to 'laying' phase

#### Scenario: Laying immobility
- **WHEN** a Lizardman is in 'laying' phase
- **THEN** it SHALL NOT move and life SHALL NOT decrease per tick

#### Scenario: Laying duration
- **WHEN** a Lizardman enters 'laying' phase
- **THEN** it SHALL remain in laying for LAYING_DURATION ticks before producing an egg

#### Scenario: Laying pickaxe immunity (FUTURE)
- **WHEN** a Lizardman in 'laying' phase is hit by the pickaxe
- **THEN** the pickaxe attack SHALL be ignored (no damage)
- **NOTE**: Not yet implemented. Planned for a future change.

### Requirement: Lizardman lifecycle - egg phase
After laying, an egg entity SHALL appear within the nest area.

#### Scenario: Egg creation
- **WHEN** a Lizardman completes laying
- **THEN** an egg SHALL be created at the nest center position with a portion of the parent's carryingNutrient

#### Scenario: Egg immobility
- **WHEN** an egg exists
- **THEN** it SHALL NOT move

#### Scenario: Egg hatching
- **WHEN** an egg has existed for EGG_HATCH_DURATION ticks
- **THEN** it SHALL hatch into a new Lizardman with the egg's carryingNutrient as initial resources

#### Scenario: Egg vulnerability
- **WHEN** a predator (Gajigajimushi) contacts an egg
- **THEN** the egg SHALL be consumed via predation

### Requirement: Phase transition processing
Phase transitions SHALL be evaluated after all other tick processing.

#### Scenario: Transition timing
- **WHEN** a game tick executes
- **THEN** phase transitions SHALL be checked after movement, predation, nutrient interaction, and life decrease

#### Scenario: Transition event emission
- **WHEN** a monster transitions to a new phase
- **THEN** the system SHALL emit a PHASE_TRANSITION event with monster ID, old phase, and new phase
