## MODIFIED Requirements

### Requirement: Gajigajimushi reproduction — replace hardcoded values with named constants

#### Scenario: Reproduction condition
- **WHEN** a Gajigajimushi in 'adult' phase has carryingNutrient >= PUPA_NUTRIENT_THRESHOLD AND life > GAJI_REPRO_LIFE_THRESHOLD (10)
- **THEN** it SHALL produce 1 larva at an adjacent empty cell

#### Scenario: Reproduction cost
- **WHEN** a Gajigajimushi reproduces
- **THEN** the parent's carryingNutrient SHALL decrease by half (floor(carryingNutrient/2)) AND life SHALL decrease by GAJI_REPRO_LIFE_COST (5)
