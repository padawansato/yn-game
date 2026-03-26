## ADDED Requirements

### Requirement: Entrance cell
The system SHALL designate the top-center cell of the grid as the entrance. The entrance position SHALL be stored in GameState.entrancePosition.

#### Scenario: Entrance position calculation
- **WHEN** a grid of width W is initialized
- **THEN** the entrance position SHALL be at (floor(W/2), 0)

#### Scenario: Entrance cell type
- **WHEN** the grid is initialized
- **THEN** the entrance cell SHALL be of type 'empty' (passable)

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
