## ADDED Requirements

### Requirement: Config editing UI
The system SHALL provide a UI for editing GameConfig parameters before starting a game.

#### Scenario: Edit monster parameters
- **WHEN** the user opens the config editor
- **THEN** the user SHALL be able to modify any monster's life, attack, predationTargets, and phase thresholds

#### Scenario: Edit game parameters
- **WHEN** the user opens the config editor
- **THEN** the user SHALL be able to modify grid size, nutrient settings, dig power, and hero settings

#### Scenario: Validation feedback
- **WHEN** the user enters an invalid value (e.g., negative life)
- **THEN** the UI SHALL display an error message and prevent game start

### Requirement: Preset management
The system SHALL allow users to save and load config presets via localStorage.

#### Scenario: Save preset
- **WHEN** the user names and saves a config
- **THEN** the config SHALL be stored in localStorage and appear in the preset list

#### Scenario: Load preset
- **WHEN** the user selects a saved preset
- **THEN** the config editor SHALL populate with that preset's values

#### Scenario: Delete preset
- **WHEN** the user deletes a preset
- **THEN** it SHALL be removed from localStorage and the preset list

### Requirement: JSON export/import
The system SHALL allow users to export and import GameConfig as JSON text.

#### Scenario: Export config
- **WHEN** the user clicks "Export"
- **THEN** the current GameConfig SHALL be displayed as a copyable JSON text string

#### Scenario: Import config
- **WHEN** the user pastes a JSON string and clicks "Import"
- **THEN** the system SHALL parse the JSON, validate it, and load the config into the editor

#### Scenario: Import invalid JSON
- **WHEN** the user pastes invalid JSON or a JSON that fails validation
- **THEN** the system SHALL display an error message and NOT change the current config
