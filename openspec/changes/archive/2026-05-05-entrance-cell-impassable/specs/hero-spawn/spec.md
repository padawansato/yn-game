## MODIFIED Requirements

### Requirement: Entrance cell

The system SHALL designate the top-center cell of the grid as the entrance. The entrance position SHALL be stored in `GameState.entrancePosition`. The entrance cell SHALL be of type `'entrance'` — passable for heroes (spawn / escape) but impassable for monsters.

#### Scenario: Entrance position calculation

- **WHEN** a grid of width W is initialized
- **THEN** the entrance position SHALL be at (floor(W/2), 0)

#### Scenario: Entrance cell type

- **WHEN** the grid is initialized
- **THEN** the entrance cell SHALL be of type `'entrance'`

#### Scenario: Monsters cannot enter entrance cell

- **WHEN** a monster's movement logic evaluates the entrance cell as a candidate destination
- **THEN** the cell SHALL be rejected as invalid (because `isValidMove` only permits cells of type `'empty'`)
- **AND** the monster SHALL NOT occupy the entrance cell at any point during a tick

#### Scenario: Heroes pass through entrance cell

- **WHEN** a hero spawns
- **THEN** the hero SHALL be placed at `entrancePosition` regardless of the cell type at that position
- **WHEN** a hero in `'returning'` state retraces its `pathHistory` to `entrancePosition`
- **THEN** the hero SHALL reach the entrance and trigger `HERO_ESCAPED` (the cell type does not block this movement because the hero return path bypasses cell-type gating)
