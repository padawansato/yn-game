## MODIFIED Requirements

### Requirement: Automatic simulation progression
The game loop SHALL automatically execute tick() at a configured interval. GameState SHALL contain a config field holding all game parameters.

#### Scenario: Auto tick execution
- **WHEN** the game loop is started (not paused)
- **THEN** tick() SHALL be called automatically at the configured interval (default: 500ms)

#### Scenario: Tick interval configuration
- **WHEN** a GameLoop is created with a custom interval
- **THEN** tick() SHALL be called at that interval

#### Scenario: GameState contains config
- **WHEN** a new GameState is created
- **THEN** it SHALL contain a config field of type GameConfig
- **AND** all game functions SHALL read parameters from state.config instead of importing constants directly
