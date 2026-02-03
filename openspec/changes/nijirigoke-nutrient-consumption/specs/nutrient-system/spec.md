## MODIFIED Requirements

### Requirement: Nijirigoke releases nutrients to soil
Nijirigoke SHALL release nutrients to adjacent soil blocks under certain conditions, but survival consumption takes priority.

#### Scenario: Release trigger
- **WHEN** a Nijirigoke with carryingNutrient > NUTRIENT_RELEASE_THRESHOLD (2) moves adjacent to a soil block
- **THEN** the Nijirigoke SHALL release nutrients until it has NUTRIENT_RELEASE_THRESHOLD nutrients remaining

#### Scenario: No release at threshold due to survival need
- **WHEN** a Nijirigoke with carryingNutrient <= NUTRIENT_RELEASE_THRESHOLD moves
- **THEN** the Nijirigoke SHALL NOT release nutrients (nutrients are reserved for survival)

#### Scenario: Release target
- **WHEN** a Nijirigoke releases nutrients
- **THEN** the nutrients SHALL be added to an adjacent soil block's nutrientAmount
