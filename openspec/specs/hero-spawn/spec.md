# Hero Spawn

## Purpose

勇者 (Hero) の出現位置・タイミング・パーティ構成を定義する。勇者は入口セルから登場し、シーケンシャルに複数体スポーンする。
## Requirements
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

### Requirement: Hero spawn timing
The system SHALL spawn heroes after a configurable delay (HERO_SPAWN_START_TICK) from the start of the game. The party size (1-3) SHALL be determined at spawn configuration time.

#### Scenario: No spawn before start tick
- **WHEN** gameTime < HERO_SPAWN_START_TICK
- **THEN** no heroes SHALL be spawned

#### Scenario: First hero spawn
- **WHEN** gameTime reaches HERO_SPAWN_START_TICK
- **THEN** the first hero of the party SHALL be spawned at the entrance position

### Requirement: Sequential party spawn
Heroes in a party SHALL spawn sequentially with a configurable interval (HERO_SPAWN_INTERVAL ticks) between each hero.

#### Scenario: Sequential spawn timing
- **WHEN** a party of size N is configured with spawn interval I
- **THEN** hero 1 SHALL spawn at HERO_SPAWN_START_TICK, hero 2 at HERO_SPAWN_START_TICK + I, hero 3 at HERO_SPAWN_START_TICK + 2*I

#### Scenario: Spawn regardless of entrance occupancy
- **WHEN** a hero is scheduled to spawn and another entity occupies the entrance cell
- **THEN** the hero SHALL spawn anyway (multiple entities can coexist on the same cell)

### Requirement: Party size announcement
The system SHALL emit an event announcing the party size before the first hero spawns.

#### Scenario: Party announcement event
- **WHEN** gameTime reaches HERO_SPAWN_START_TICK - HERO_ANNOUNCE_TICKS
- **THEN** the system SHALL emit a HERO_PARTY_ANNOUNCED event with the party size

