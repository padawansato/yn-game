## ADDED Requirements

### Requirement: Score calculation
The system SHALL calculate a score after a game ends.

#### Scenario: Score based on survival ticks
- **WHEN** the game ends (hero reaches entrance with demon lord info)
- **THEN** the score SHALL be the gameTime value at the time of game over

#### Scenario: Score display
- **WHEN** the game ends
- **THEN** the score SHALL be displayed prominently to the user

### Requirement: Battle data export
The system SHALL allow exporting a "battle data" text that combines GameConfig and score.

#### Scenario: Export battle data
- **WHEN** the user clicks "Export Battle Data" after a game
- **THEN** the system SHALL produce a copyable text containing the GameConfig JSON and the score

#### Scenario: Battle data format
- **WHEN** battle data is exported
- **THEN** the text SHALL be a JSON object with fields: config (GameConfig), score (number), and seed (number for deterministic replay)

### Requirement: Challenge mode
The system SHALL allow importing battle data to play the same configuration.

#### Scenario: Import challenge
- **WHEN** the user pastes battle data text and clicks "Challenge"
- **THEN** the system SHALL load the GameConfig and start a new game with that config and seed

#### Scenario: Score comparison
- **WHEN** the user completes a challenge game
- **THEN** the system SHALL display both the original score and the user's score side by side
