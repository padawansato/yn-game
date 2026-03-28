## MODIFIED Requirements

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
- **THEN** it SHALL remain in pupa for PUPA_DURATION (6) ticks before transitioning to 'adult'

### Requirement: Gajigajimushi reproduction threshold
A Gajigajimushi in 'adult' phase SHALL reproduce when it has sufficient nutrients and life.

#### Scenario: Adult reproduction condition
- **WHEN** a Gajigajimushi in 'adult' phase has carryingNutrient >= PUPA_NUTRIENT_THRESHOLD AND life > GAJI_REPRO_LIFE_THRESHOLD (6)
- **THEN** it SHALL produce one larva offspring and consume GAJI_REPRO_LIFE_COST (5) life
