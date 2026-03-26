## MODIFIED Requirements

### Requirement: Nutrient conservation law
The system SHALL guarantee that the total nutrient quantity (sum of all Cell.nutrientAmount + all Monster.carryingNutrient) remains constant across all game ticks. The only exception is external additions from hero deaths: when a hero dies, HERO_NUTRIENT_DROP nutrients SHALL be added to the surrounding 9 cells, increasing the total nutrient count by that amount.

#### Scenario: Conservation across tick
- **WHEN** a game tick is executed without hero deaths
- **THEN** the total nutrients after the tick SHALL equal the total nutrients before the tick

#### Scenario: Conservation across dig
- **WHEN** the player digs a soil block with N nutrients
- **THEN** the total nutrients after digging SHALL equal the total nutrients before digging

#### Scenario: Conservation across monster death
- **WHEN** a monster with carryingNutrient = N dies
- **THEN** N nutrients SHALL be distributed to surrounding cells, and the total nutrients SHALL remain unchanged

#### Scenario: Conservation across predation
- **WHEN** predation occurs and the prey has carryingNutrient = N
- **THEN** N nutrients SHALL be released to surrounding cells, and the total nutrients SHALL remain unchanged

#### Scenario: Conservation across reproduction
- **WHEN** a monster reproduces and creates offspring
- **THEN** the parent's carryingNutrient SHALL be distributed among offspring, and the total nutrients SHALL remain unchanged

#### Scenario: External addition from hero death
- **WHEN** a hero dies in combat
- **THEN** HERO_NUTRIENT_DROP nutrients SHALL be added to the surrounding 9 cells (following the same distribution logic as monster death), and the total nutrient count SHALL increase by exactly HERO_NUTRIENT_DROP
