# Monster Spawn by Nutrient

## Purpose

土を掘った際に、養分量に応じて異なるモンスターが生成されるシステム。原作ゲームの仕様に準拠。

## Requirements

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
