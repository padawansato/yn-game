## ADDED Requirements

### Requirement: Demon lord flag placement
The system SHALL support a demon lord flag stored in GameState.demonLordPosition (Position | null). Initially null (no demon lord placed). The player places the demon lord before heroes spawn.

#### Scenario: Initial state has no demon lord
- **WHEN** the game is initialized
- **THEN** GameState.demonLordPosition SHALL be null

#### Scenario: Demon lord placement by player
- **WHEN** the player places the demon lord on an empty cell at position (x, y)
- **THEN** GameState.demonLordPosition SHALL be set to { x, y }

#### Scenario: Demon lord on passable cell
- **WHEN** the demon lord flag is placed
- **THEN** it SHALL be on an empty cell (not soil or wall)

#### Scenario: No hero spawn without demon lord
- **WHEN** demonLordPosition is null
- **THEN** no heroes SHALL be spawned regardless of gameTime

### Requirement: Demon lord is non-entity
The demon lord flag SHALL NOT be an entity. It is a map marker only — it has no life, no movement, and no interaction with monsters or nutrients.

#### Scenario: Demon lord has no life
- **WHEN** a monster moves to the demon lord position
- **THEN** no predation or combat SHALL occur with the demon lord (it is not a target)

#### Scenario: Demon lord is invisible to monsters
- **WHEN** any monster occupies the demon lord cell
- **THEN** the monster's behavior SHALL be unaffected by the demon lord's presence

### Requirement: Game over on hero escape
The system SHALL trigger a game over when any hero in 'returning' state reaches the entrance position.

#### Scenario: Single hero escapes
- **WHEN** a returning hero reaches the entrance position
- **THEN** GameState.isGameOver SHALL be set to true and a GAME_OVER event SHALL be emitted

#### Scenario: Game continues while heroes are exploring
- **WHEN** all active heroes are in 'exploring' state and none has reached the entrance while returning
- **THEN** isGameOver SHALL remain false

#### Scenario: All heroes defeated
- **WHEN** all heroes in the current party are dead and none has escaped
- **THEN** the game SHALL continue (the player has successfully defended)
