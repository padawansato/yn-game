## ADDED Requirements

### Requirement: ASCII grid display
The CLI SHALL render the game grid using half-width characters only (no full-width). Each cell is 2 half-width characters.

#### Scenario: Cell rendering
- **WHEN** the grid is displayed
- **THEN** wall cells SHALL show `##`, soil cells `..`, empty cells `  ` (2 spaces)

#### Scenario: Monster rendering (half-width 2-char)
- **WHEN** a single monster occupies a cell
- **THEN** it SHALL be displayed with a 2-character half-width symbol based on type and phase:
  - nijirigoke: `Nj` (mobile), `Nb` (bud), `Nf` (flower), `Nw` (withered)
  - gajigajimushi: `Gj` (larva), `Gp` (pupa), `Ga` (adult)
  - lizardman: `Lz` (normal/nesting), `Ll` (laying), `Eg` (egg)
- **AND** ANSI color SHALL indicate monster type (green=nijirigoke, blue=gajigajimushi, red=lizardman)

#### Scenario: Multiple monsters at same cell
- **WHEN** multiple monsters occupy the same cell
- **THEN** the cell SHALL display the overlap count as a half-width number + space (e.g., `2 `, `3 `)
- **AND** the color SHALL match the highest-priority monster (lizardman > gajigajimushi > nijirigoke)

### Requirement: Monster state display
The CLI SHALL display monster information in a readable format.

#### Scenario: Monster list format
- **WHEN** monsters are listed
- **THEN** each monster SHALL show: id, type, phase, position, life/maxLife, carryingNutrient, nest info
- **AND** output SHALL be aligned in columns

### Requirement: Event display
The CLI SHALL display game events as they occur.

#### Scenario: Event formatting
- **WHEN** a game event occurs during a tick
- **THEN** important events SHALL be displayed with type-specific formatting:
  - `>> PHASE: <id> <old> → <new>`
  - `>> DIED: <id> (<cause>)`
  - `>> EGG LAID: parent=<id> pos(<x>,<y>)`
  - `>> EGG HATCHED: <id> pos(<x>,<y>)`
  - `>> REPRODUCED: parent=<id> → <count> offspring`
  - `>> SPAWNED: <id> <type>`

#### Scenario: Tick header
- **WHEN** a tick completes with events
- **THEN** the tick number SHALL be displayed as a header before events
