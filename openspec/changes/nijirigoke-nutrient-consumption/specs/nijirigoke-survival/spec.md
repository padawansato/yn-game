## ADDED Requirements

### Requirement: Nijirigoke consumes nutrients to survive
Nijirigoke SHALL consume carried nutrients instead of losing life when moving, as long as nutrients are available.

#### Scenario: Movement with nutrients available
- **WHEN** a Nijirigoke with carryingNutrient > 0 moves to an adjacent cell
- **THEN** the Nijirigoke SHALL consume 1 nutrient (carryingNutrient decreases by 1) AND life SHALL remain unchanged

#### Scenario: Movement without nutrients
- **WHEN** a Nijirigoke with carryingNutrient = 0 moves to an adjacent cell
- **THEN** the Nijirigoke SHALL lose 1 life (standard MOVEMENT_LIFE_COST)

#### Scenario: Nutrient consumption priority over release
- **WHEN** a Nijirigoke with carryingNutrient = 2 moves (at NUTRIENT_RELEASE_THRESHOLD)
- **THEN** the Nijirigoke SHALL consume 1 nutrient for survival (carryingNutrient becomes 1) AND SHALL NOT release nutrients to soil

#### Scenario: Extended survival in nutrient-rich area
- **WHEN** a Nijirigoke continuously absorbs nutrients from adjacent soil while moving
- **THEN** the Nijirigoke SHALL survive indefinitely as long as nutrients are available to absorb
