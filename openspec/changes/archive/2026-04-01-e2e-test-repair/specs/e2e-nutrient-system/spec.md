## ADDED Requirements

### Requirement: Dig soil with nutrients spawns monster
The E2E test SHALL verify that digging a soil cell with nutrients > 0 spawns a monster.

#### Scenario: Dig nutrient-rich soil
- **WHEN** a soil cell with nutrientAmount > 0 is clicked
- **THEN** the cell SHALL become empty AND a monster SHALL appear on the grid

### Requirement: Dig soil with zero nutrients creates empty space only
The E2E test SHALL verify that digging a soil cell with 0 nutrients creates only an empty cell.

#### Scenario: Dig zero-nutrient soil
- **WHEN** a soil cell with nutrientAmount = 0 is clicked
- **THEN** the cell SHALL become empty AND no new monster SHALL appear

### Requirement: Nijirigoke movement verification
The E2E test SHALL verify that a nijirigoke moves across the grid over multiple ticks.

#### Scenario: Monster moves after ticks
- **WHEN** a nijirigoke exists on the grid and multiple ticks advance
- **THEN** the nijirigoke's position SHALL change (cell content moves to a different cell)

### Requirement: Status displays nutrient information
The E2E test SHALL verify that the game status area shows nutrient-related data.

#### Scenario: Nutrient info in status
- **WHEN** the game is loaded
- **THEN** the status area SHALL display total nutrient count

### Requirement: Nutrient amount determines monster type
The E2E test SHALL verify that high-nutrient soil spawns stronger monsters.

#### Scenario: High nutrient spawns lizardman
- **WHEN** a soil cell with nutrientAmount >= 17 is dug
- **THEN** a lizardman (蜥) SHALL appear
