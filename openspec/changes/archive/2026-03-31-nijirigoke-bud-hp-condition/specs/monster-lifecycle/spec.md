## MODIFIED Requirements

### Requirement: Nijirigoke lifecycle - bud transition
A Nijirigoke SHALL transition from 'mobile' to 'bud' when it has accumulated sufficient nutrients AND has been in mobile phase for a minimum number of ticks.

#### Scenario: Bud transition condition
- **WHEN** a Nijirigoke has carryingNutrient >= BUD_NUTRIENT_THRESHOLD (4) AND phaseTickCounter >= minMobileTicks (default: 8)
- **THEN** it SHALL transition to 'bud' phase

#### Scenario: No bud transition before minimum ticks
- **WHEN** a Nijirigoke has carryingNutrient >= BUD_NUTRIENT_THRESHOLD (4) AND phaseTickCounter < minMobileTicks
- **THEN** it SHALL NOT transition to 'bud' phase and SHALL remain in 'mobile' phase

#### Scenario: Mobile phase tick counter
- **WHEN** a Nijirigoke is in 'mobile' phase during a tick
- **THEN** its phaseTickCounter SHALL increment by 1

#### Scenario: Bud immobility
- **WHEN** a Nijirigoke is in 'bud' phase
- **THEN** it SHALL NOT move (fixed position)

#### Scenario: Bud absorption range
- **WHEN** a Nijirigoke is in 'bud' phase
- **THEN** it SHALL absorb nutrients from surrounding 9 cells (8 adjacent + center), not just 4 directional cells
