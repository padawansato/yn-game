## ADDED Requirements

### Requirement: Automatic simulation progression
The game loop SHALL automatically execute tick() at a configured interval.

#### Scenario: Auto tick execution
- **WHEN** the game loop is started (not paused)
- **THEN** tick() SHALL be called automatically at the configured interval (default: 500ms)

#### Scenario: Tick interval configuration
- **WHEN** a GameLoop is created with a custom interval
- **THEN** tick() SHALL be called at that interval

### Requirement: Game time tracking
The game SHALL track elapsed game time in ticks.

#### Scenario: Game time increment
- **WHEN** a tick is executed
- **THEN** gameTime SHALL increment by 1

#### Scenario: Initial game time
- **WHEN** a new game state is created
- **THEN** gameTime SHALL be initialized to 0

### Requirement: Game loop control
The game loop SHALL support start, stop, pause, and resume operations.

#### Scenario: Start game loop
- **WHEN** start() is called on a stopped game loop
- **THEN** automatic tick execution SHALL begin

#### Scenario: Stop game loop
- **WHEN** stop() is called on a running game loop
- **THEN** automatic tick execution SHALL cease
- **AND** gameTime SHALL be preserved

#### Scenario: Pause game loop
- **WHEN** pause() is called on a running game loop
- **THEN** automatic tick execution SHALL pause
- **AND** gameTime SHALL be preserved

#### Scenario: Resume game loop
- **WHEN** resume() is called on a paused game loop
- **THEN** automatic tick execution SHALL resume from where it paused
