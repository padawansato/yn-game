## REMOVED Requirements

### Requirement: Moss carries nutrients
**Reason**: 養分はエンティティではなく土ブロックの内部パラメータ。ニジリゴケは養分を「運搬」するのではなく「吸収/吐き出し」する。
**Migration**: Monster.carryingNutrientをstring|nullからnumberに変更し、Nutrientエンティティを削除。

## MODIFIED Requirements

### Requirement: Fixed nutrient pool
The system SHALL manage nutrients as internal parameters of soil blocks. Nutrients SHALL exist only within soil cells, never as independent entities.

#### Scenario: Initial nutrient distribution
- **WHEN** a new game starts
- **THEN** nutrients SHALL be distributed across soil blocks as internal cell parameters (nutrientAmount 0-100)

#### Scenario: Nutrient location constraint
- **WHEN** the game state is validated
- **THEN** nutrients SHALL only exist in soil cells (Cell.nutrientAmount > 0 only when Cell.type === 'soil')

#### Scenario: Empty and wall cells have no nutrients
- **WHEN** a cell is empty or wall type
- **THEN** its nutrientAmount SHALL always be 0

#### Scenario: Nutrient conservation
- **WHEN** any game action occurs
- **THEN** the total nutrient amount (sum of all soil nutrientAmount + all monster carryingNutrient) SHALL remain constant or decrease, never increase

### Requirement: Digging depletes nutrients
The system SHALL spawn a Nijirigoke when digging soil with nutrients. The spawned monster's strength depends on the soil's nutrient amount.

#### Scenario: Dig soil block with nutrients
- **WHEN** the player digs a soil block with N > 0 nutrients
- **THEN** the soil SHALL become empty, a Nijirigoke SHALL spawn, and 30% of N SHALL be lost

#### Scenario: Monster strength from nutrients
- **WHEN** a Nijirigoke spawns from soil with N nutrients
- **THEN** its initial life SHALL be proportional to N (70% of N, capped at maxLife)

#### Scenario: Dig nutrient-poor soil
- **WHEN** the player digs a soil block with 0 nutrients
- **THEN** the soil SHALL become empty but NO Nijirigoke SHALL spawn

## ADDED Requirements

### Requirement: Nijirigoke absorbs nutrients from soil
Nijirigoke SHALL absorb nutrients from adjacent soil blocks while moving through empty cells.

#### Scenario: Absorption trigger
- **WHEN** a Nijirigoke moves to an empty cell adjacent to a soil block with nutrients
- **THEN** the Nijirigoke MAY absorb nutrients from that soil

#### Scenario: Absorption amount
- **WHEN** a Nijirigoke absorbs nutrients from a soil block
- **THEN** it SHALL take nutrients until the soil has 0 or the Nijirigoke reaches its carry capacity

#### Scenario: Absorption priority
- **WHEN** a Nijirigoke is adjacent to multiple soil blocks with nutrients
- **THEN** it SHALL absorb from the soil block in its facing direction first

### Requirement: Nijirigoke releases nutrients to soil
Nijirigoke SHALL release nutrients to adjacent soil blocks under certain conditions.

#### Scenario: Release trigger
- **WHEN** a Nijirigoke with 2+ nutrients moves adjacent to a soil block
- **THEN** the Nijirigoke SHALL release nutrients until it has only 1 nutrient remaining

#### Scenario: Release target
- **WHEN** a Nijirigoke releases nutrients
- **THEN** the nutrients SHALL be added to an adjacent soil block's nutrientAmount

#### Scenario: Release to nutrient-rich soil
- **WHEN** a Nijirigoke releases nutrients to a soil block
- **THEN** the soil's nutrientAmount SHALL increase (nutrients accumulate for stronger monster spawning)

### Requirement: Monster death releases nutrients
When a monster dies, its carried nutrients SHALL be released to adjacent soil.

#### Scenario: Death near soil
- **WHEN** a monster with N carried nutrients dies adjacent to soil blocks
- **THEN** the N nutrients SHALL be distributed to adjacent soil blocks

#### Scenario: Death with no adjacent soil
- **WHEN** a monster with N carried nutrients dies with no adjacent soil
- **THEN** the N nutrients SHALL be permanently lost (entropy)

### Requirement: Nutrient carrying capacity
Monsters SHALL have a maximum nutrient carrying capacity.

#### Scenario: Nijirigoke capacity
- **WHEN** a Nijirigoke attempts to absorb more nutrients
- **THEN** it SHALL NOT exceed its maximum carrying capacity (default: 10)

#### Scenario: Capacity check
- **WHEN** the game state is validated
- **THEN** no monster's carryingNutrient SHALL exceed its carry capacity
