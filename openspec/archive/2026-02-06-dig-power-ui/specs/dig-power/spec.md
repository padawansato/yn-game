## ADDED Requirements

### Requirement: Dig power UI display
The game UI SHALL display the current dig power value.

#### Scenario: Dig power visible in status area
- **WHEN** the game is running
- **THEN** the current digPower value SHALL be displayed in the status area

#### Scenario: Dig power updates on dig
- **WHEN** the player successfully digs a block
- **THEN** the displayed digPower SHALL decrease by 1

### Requirement: Dig exhaustion warning
The game UI SHALL indicate when dig power is exhausted.

#### Scenario: Zero dig power warning
- **WHEN** digPower reaches 0
- **THEN** the UI SHALL display a warning indicating digging is no longer possible
