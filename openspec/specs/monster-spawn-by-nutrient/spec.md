# Monster Spawn by Nutrient

## Purpose

土を掘った際に、養分量に応じて異なるモンスターが生成されるシステム。原作ゲームの仕様に準拠。

## Requirements

### Requirement: Monster type determined by nutrient level
The system SHALL spawn different monster types based on the soil's nutrient amount when digging (based on original game).

#### Scenario: Low nutrient soil spawns Nijirigoke
- **WHEN** the player digs a soil block with nutrientAmount between 1 and 9
- **THEN** a Nijirigoke SHALL spawn at that position

#### Scenario: Medium nutrient soil spawns Gajigajimushi
- **WHEN** the player digs a soil block with nutrientAmount between 10 and 16
- **THEN** a Gajigajimushi SHALL spawn at that position

#### Scenario: High nutrient soil spawns Lizardman
- **WHEN** the player digs a soil block with nutrientAmount of 17 or more
- **THEN** a Lizardman SHALL spawn at that position

#### Scenario: Zero nutrient soil spawns nothing
- **WHEN** the player digs a soil block with nutrientAmount of 0
- **THEN** no monster SHALL spawn (existing behavior)

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
