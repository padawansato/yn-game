## MODIFIED Requirements

### Requirement: Spawned monster life based on nutrients
The spawned monster's initial life SHALL be based on the full soil nutrients (no depletion), capped at the monster's maxLife. Excess nutrients SHALL be preserved per conservation law.

#### Scenario: Monster life calculation (conservation)
- **WHEN** a monster spawns from soil with N nutrients
- **THEN** its initial life SHALL be min(N, maxLife)

#### Scenario: Excess nutrient handling
- **WHEN** a monster spawns from soil with N nutrients AND N > maxLife
- **THEN** the excess (N - maxLife) SHALL be set as the monster's initial carryingNutrient, or distributed to surrounding cells if carryingNutrient capacity is exceeded

#### Scenario: Full nutrient transfer
- **WHEN** a monster spawns from soil with N nutrients AND N <= maxLife
- **THEN** the monster's initial life SHALL be N AND carryingNutrient SHALL be 0 AND the soil cell's nutrientAmount SHALL become 0
