## ADDED Requirements

### Requirement: Demon lord placement via UI
The E2E test SHALL verify that the player can place a demon lord through the UI.

#### Scenario: Place demon lord
- **WHEN** the "勇者を呼ぶ" button is clicked AND an empty cell is clicked
- **THEN** the clicked cell SHALL display the demon lord marker (`.demon-lord-cell`)

### Requirement: Hero spawn after demon lord placement
The E2E test SHALL verify that heroes spawn after the demon lord is placed and sufficient ticks pass.

#### Scenario: Hero appears on grid
- **WHEN** a demon lord is placed AND ticks advance past the spawn threshold
- **THEN** at least one hero cell (`.hero-cell`) SHALL appear on the grid AND hero status information SHALL be displayed

### Requirement: Hero-monster combat event
The E2E test SHALL verify that combat occurs when a hero encounters a monster.

#### Scenario: Combat event logged
- **WHEN** a hero is adjacent to a monster and a tick advances
- **THEN** the event log SHALL contain a combat-related event

### Requirement: Game over on hero escape
The E2E test SHALL verify that the game ends when a hero finds the demon lord and returns to the entrance.

#### Scenario: Game over banner displayed
- **WHEN** a hero discovers the demon lord AND returns to the entrance
- **THEN** the game over banner (`.game-over-banner`) SHALL be displayed

### Requirement: Heroes immune to pickaxe
The E2E test SHALL verify that clicking on a hero cell does not damage the hero.

#### Scenario: Pickaxe click on hero
- **WHEN** a hero cell is clicked (pickaxe attack)
- **THEN** the hero's HP SHALL remain unchanged
