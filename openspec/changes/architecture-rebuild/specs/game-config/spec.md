## ADDED Requirements

### Requirement: GameConfig type definition
The system SHALL define a `GameConfig` type that contains all game parameters as a single serializable object.

#### Scenario: GameConfig contains grid settings
- **WHEN** a GameConfig is created
- **THEN** it SHALL include grid.defaultWidth, grid.defaultHeight, grid.maxNutrientPerCell

#### Scenario: GameConfig contains nutrient settings
- **WHEN** a GameConfig is created
- **THEN** it SHALL include nutrient.carryCapacity, nutrient.releaseThreshold, nutrient.hungerThresholdRatio

#### Scenario: GameConfig contains movement settings
- **WHEN** a GameConfig is created
- **THEN** it SHALL include movement.lifeCost

#### Scenario: GameConfig contains spawn thresholds
- **WHEN** a GameConfig is created
- **THEN** it SHALL include spawn.thresholds as an array of { type: string, minNutrient: number }

#### Scenario: GameConfig contains dig settings
- **WHEN** a GameConfig is created
- **THEN** it SHALL include dig.initialPower, dig.pickaxeDamage

#### Scenario: GameConfig contains monster definitions
- **WHEN** a GameConfig is created
- **THEN** it SHALL include monsters as a Record<string, MonsterTypeConfig> where each entry defines type, pattern, life, attack, predationTargets, canCarryNutrients, and phase transition thresholds

#### Scenario: GameConfig contains hero settings
- **WHEN** a GameConfig is created
- **THEN** it SHALL include hero.life, hero.attack, hero.spawnStartTick, hero.spawnInterval, hero.nutrientDrop

### Requirement: Default config generation
The system SHALL provide a `createDefaultConfig()` function that returns a GameConfig with the current hardcoded values.

#### Scenario: Default config matches current constants
- **WHEN** createDefaultConfig() is called
- **THEN** the returned GameConfig SHALL contain values identical to the current constants.ts values

#### Scenario: Default config is a fresh copy
- **WHEN** createDefaultConfig() is called multiple times
- **THEN** each call SHALL return an independent object (mutations to one SHALL NOT affect others)

### Requirement: Config validation
The system SHALL provide a `validateConfig()` function that checks GameConfig integrity.

#### Scenario: Valid config passes
- **WHEN** validateConfig() is called with a valid GameConfig
- **THEN** it SHALL return success

#### Scenario: Negative life rejected
- **WHEN** validateConfig() is called with a monster whose life <= 0
- **THEN** it SHALL return an error indicating the invalid field

#### Scenario: Invalid predation target rejected
- **WHEN** validateConfig() is called with a monster whose predationTargets references a type not present in config.monsters
- **THEN** it SHALL return an error indicating the invalid reference

### Requirement: Config serialization
GameConfig SHALL be JSON-serializable for export/import.

#### Scenario: Round-trip serialization
- **WHEN** a GameConfig is serialized with JSON.stringify and deserialized with JSON.parse
- **THEN** the result SHALL be functionally equivalent to the original
