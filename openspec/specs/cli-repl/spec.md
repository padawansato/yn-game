## ADDED Requirements

### Requirement: CLI REPL startup
The CLI SHALL start an interactive REPL session with a default game state.

#### Scenario: Default startup
- **WHEN** the user runs the CLI without arguments
- **THEN** a default game state SHALL be created (10x8 grid, 200 nutrients, seed=42)
- **AND** the ASCII grid SHALL be displayed
- **AND** a prompt (`yn> `) SHALL appear waiting for input

#### Scenario: Startup with seed
- **WHEN** the user runs the CLI with `--seed <N>`
- **THEN** the PRNG SHALL be initialized with seed N

### Requirement: Dig command
The CLI SHALL support digging at a specified position.

#### Scenario: Successful dig
- **WHEN** the user enters `dig <x>,<y>`
- **THEN** the dig action SHALL be executed on the game state
- **AND** spawned monster info and the updated grid SHALL be displayed

#### Scenario: Failed dig
- **WHEN** the user enters `dig <x>,<y>` on an invalid position
- **THEN** the error message SHALL be displayed

### Requirement: Tick command
The CLI SHALL support advancing the game by one or more ticks.

#### Scenario: Single tick
- **WHEN** the user enters `tick`
- **THEN** one game tick SHALL be executed
- **AND** any events (phase transitions, deaths, etc.) SHALL be displayed

#### Scenario: Multiple ticks
- **WHEN** the user enters `tick <N>`
- **THEN** N game ticks SHALL be executed
- **AND** important events from each tick SHALL be displayed

### Requirement: Auto-run mode
The CLI SHALL support automatic tick execution.

#### Scenario: Start auto-run
- **WHEN** the user enters `run`
- **THEN** ticks SHALL execute automatically at 500ms intervals
- **AND** events SHALL be displayed in real-time

#### Scenario: Stop auto-run
- **WHEN** the user enters `stop` or presses Ctrl+C during auto-run
- **THEN** auto-run SHALL stop and return to the prompt

### Requirement: State inspection commands
The CLI SHALL support inspecting game state.

#### Scenario: Status command
- **WHEN** the user enters `status`
- **THEN** game time, total nutrients, dig power, and monster summary SHALL be displayed

#### Scenario: Grid command
- **WHEN** the user enters `grid`
- **THEN** the ASCII grid SHALL be displayed

#### Scenario: Monsters list
- **WHEN** the user enters `monsters`
- **THEN** all monsters SHALL be listed with id, type, phase, position, life, nutrients

#### Scenario: Monsters filter by type
- **WHEN** the user enters `monsters <type>`
- **THEN** only monsters of that type SHALL be listed

#### Scenario: Monster detail
- **WHEN** the user enters `monster <id>`
- **THEN** full details of that monster SHALL be displayed

### Requirement: Scenario loading
The CLI SHALL support loading preset scenarios.

#### Scenario: Load scenario
- **WHEN** the user enters `scenario <name>`
- **THEN** the game state SHALL be replaced with the preset scenario
- **AND** the seed SHALL be reset to 42

#### Scenario: List scenarios
- **WHEN** the user enters `scenario list`
- **THEN** available scenario names and descriptions SHALL be listed

### Requirement: Seed control
The CLI SHALL support changing the PRNG seed.

#### Scenario: Set seed
- **WHEN** the user enters `seed <N>`
- **THEN** the PRNG SHALL be re-initialized with seed N

### Requirement: Reset and quit
The CLI SHALL support resetting and exiting.

#### Scenario: Reset
- **WHEN** the user enters `reset`
- **THEN** the game state SHALL be reset to the initial state

#### Scenario: Quit
- **WHEN** the user enters `quit` or `exit`
- **THEN** the CLI SHALL exit
