## MODIFIED Requirements

### Requirement: Monster type determined by nutrient level
The system SHALL spawn different monster types based on the soil's nutrient amount when digging, using thresholds from GameConfig.spawn.thresholds instead of hardcoded constants.

#### Scenario: Spawn type lookup from config
- **WHEN** the player digs a soil block with nutrientAmount N
- **THEN** the system SHALL iterate state.config.spawn.thresholds (sorted by minNutrient descending) and spawn the first type whose minNutrient <= N

#### Scenario: Default thresholds match current behavior
- **WHEN** using default config
- **THEN** nutrient 1-9 SHALL spawn nijirigoke, 10-16 SHALL spawn gajigajimushi, 17+ SHALL spawn lizardman

#### Scenario: Fallback to nijirigoke when no threshold matches
- **WHEN** the nutrient amount does not meet any threshold in spawn.thresholds
- **THEN** the system SHALL spawn nijirigoke as the default monster type

#### Scenario: Custom spawn thresholds
- **WHEN** a user configures custom spawn.thresholds (e.g., adding a new monster type at threshold 25)
- **THEN** the system SHALL use the custom thresholds for determining spawn type

#### Scenario: Zero nutrient soil spawns nothing
- **WHEN** the player digs a soil block with nutrientAmount of 0
- **THEN** no monster SHALL spawn
