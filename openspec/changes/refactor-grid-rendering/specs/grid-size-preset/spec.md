## ADDED Requirements

### Requirement: Grid size preset catalog

The system SHALL define a catalog of named grid size presets in `src/core/constants.ts` as `GRID_PRESETS`. Each preset SHALL specify `width` and `height` in cells. The catalog SHALL be the single source of truth for discrete grid size options.

#### Scenario: Catalog contains small and large presets

- **WHEN** `GRID_PRESETS` is examined
- **THEN** it SHALL contain at least the following presets:
  - `small` with `width` 10 and `height` 8
  - `large` with `width` 20 and `height` 15

#### Scenario: Preset values are positive integers

- **WHEN** a preset's `width` or `height` is accessed
- **THEN** the value SHALL be a positive integer strictly greater than zero

#### Scenario: No duplicate numeric literals for grid sizes

- **WHEN** `src/core/constants.ts` is examined
- **THEN** the numeric literals representing grid dimensions SHALL appear only within `GRID_PRESETS`
- **AND** the legacy standalone constants `DEFAULT_GRID_WIDTH` and `DEFAULT_GRID_HEIGHT` SHALL either be removed or redefined to reference `GRID_PRESETS.small.width` / `GRID_PRESETS.small.height`, eliminating value duplication

### Requirement: Default config derives from small preset

`createDefaultConfig()` SHALL derive `grid.defaultWidth` and `grid.defaultHeight` from `GRID_PRESETS.small` rather than from independent constants. This ensures that the default game state uses the small preset, preserving existing behavior and game balance.

#### Scenario: Default config uses small preset dimensions

- **WHEN** `createDefaultConfig()` is called
- **THEN** the returned config's `grid.defaultWidth` SHALL equal `GRID_PRESETS.small.width`
- **AND** the returned config's `grid.defaultHeight` SHALL equal `GRID_PRESETS.small.height`

#### Scenario: Initial app startup uses small preset

- **WHEN** the application is mounted without any user interaction
- **THEN** the initial grid SHALL have dimensions matching `GRID_PRESETS.small` (10×8)

### Requirement: Runtime preset switching UI

The UI SHALL provide buttons that allow the user to switch the active grid size preset at runtime. Clicking a preset button SHALL stop any running game loop, create a new game state using the selected preset's dimensions, and reset the UI state.

#### Scenario: Preset buttons are rendered

- **WHEN** `App.vue` is mounted
- **THEN** the rendered output SHALL contain one button per preset defined in `GRID_PRESETS`
- **AND** each button SHALL display a label that includes both the preset name and its dimensions (e.g., `小 10×8`, `大 20×15`)

#### Scenario: Preset selection resets the game

- **WHEN** the user clicks a preset button different from the currently active one
- **THEN** the system SHALL stop the game loop if it is running
- **AND** SHALL create a new `GameState` using the selected preset's `width` and `height`
- **AND** SHALL reset the event log, `isPaused`, `heroesTriggered`, and `isPlacingDemonLord` flags
- **AND** SHALL preserve all other `GameConfig` settings (monster configs, hero configs, nutrient thresholds, etc.)

#### Scenario: Active preset is visually marked

- **WHEN** a preset is currently active
- **THEN** its button SHALL be rendered with a distinguishing visual state (e.g., a CSS class like `active` or a different background)
- **AND** only one preset button SHALL be marked as active at any given time

#### Scenario: Re-clicking active preset is a no-op or reset

- **WHEN** the user clicks the button corresponding to the currently active preset
- **THEN** the system MAY either treat it as a no-op or as an explicit reset (implementer's choice)
- **AND** in either case the preset itself SHALL remain active

### Requirement: Preset selection does not interfere with scenarios

Scenarios SHALL continue to use their own fixed grid sizes (applied via spread override of the base config) and SHALL NOT be affected by the currently selected preset. The selected preset SHALL be restored when the user resets from a scenario.

#### Scenario: Scenario uses its own size regardless of preset

- **WHEN** the user selects the `large` preset, then clicks a scenario button (e.g., リザードマン産卵)
- **THEN** the scenario SHALL initialize with its own grid size (12×10), not 20×15

#### Scenario: Reset returns to selected preset

- **WHEN** the user is in a scenario state and clicks the `Reset` button
- **THEN** the game SHALL be reset using the currently active preset's dimensions, not the scenario's dimensions
