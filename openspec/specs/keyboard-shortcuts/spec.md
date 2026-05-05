# keyboard-shortcuts Specification

## Purpose
TBD - created by archiving change keyboard-shortcuts. Update Purpose after archive.
## Requirements
### Requirement: Keyboard shortcut bindings

The system SHALL provide global keyboard shortcuts for primary debug-UI actions while a game session is open in the browser. Each shortcut SHALL invoke a single observable action.

#### Scenario: Space toggles play state

- **WHEN** the user presses `Space` and no input element is focused
- **THEN** the system SHALL start the game if not running, pause it if running and not paused, resume it if paused

#### Scenario: T advances one tick

- **WHEN** the user presses `T` (case-insensitive) and no input element is focused
- **THEN** the system SHALL execute exactly one tick of the simulation

#### Scenario: R resets the game

- **WHEN** the user presses `R` (case-insensitive) and no input element is focused
- **THEN** the system SHALL reset to the initial state of the currently-active preset (events cleared, placement banner cleared, hero phase reset)

#### Scenario: 1 / 2 select grid size preset

- **WHEN** the user presses `1` and no input element is focused
- **THEN** the system SHALL switch to the `small` preset
- **WHEN** the user presses `2` and no input element is focused
- **THEN** the system SHALL switch to the `large` preset

#### Scenario: F1〜F4 trigger scenarios

- **WHEN** the user presses `F1` and no input element is focused
- **THEN** the system SHALL run scenario index 1 (current `SCENARIOS[0]`)
- **AND** the same SHALL apply for `F2`, `F3`, `F4` mapped to scenarios 2, 3, 4
- **AND** the browser default behavior for these keys SHALL be prevented

#### Scenario: D / H summon the hero phase

- **WHEN** the user presses `D` or `H` (case-insensitive) and no input element is focused, and the hero phase has not been triggered yet
- **THEN** the system SHALL trigger the hero phase (open the demon-lord placement banner)
- **WHEN** the hero phase has already been triggered
- **THEN** the key SHALL be a no-op

#### Scenario: ? toggles the help modal

- **WHEN** the user presses `?` (Shift+/) and no input element is focused
- **THEN** the system SHALL toggle the visibility of the keyboard-help modal

#### Scenario: Escape closes help, then cancels placement

- **WHEN** the user presses `Escape` and the help modal is open
- **THEN** the system SHALL close the help modal
- **WHEN** the help modal is closed AND demon-lord placement mode is active
- **THEN** pressing `Escape` SHALL cancel placement mode (clear the placement banner)

### Requirement: Input-focus suppression

The system SHALL suppress all keyboard shortcuts while text input is in progress, so that typing does not interfere with shortcuts and vice versa.

#### Scenario: Shortcut suppressed during INPUT focus

- **WHEN** an element with tag name `INPUT` is the active document element AND the user presses any shortcut key
- **THEN** no shortcut handler SHALL be invoked

#### Scenario: Shortcut suppressed during TEXTAREA focus

- **WHEN** an element with tag name `TEXTAREA` is the active document element AND the user presses any shortcut key
- **THEN** no shortcut handler SHALL be invoked

#### Scenario: Shortcut suppressed during contenteditable focus

- **WHEN** an element with `isContentEditable === true` is the active document element AND the user presses any shortcut key
- **THEN** no shortcut handler SHALL be invoked

### Requirement: Lifecycle binding and unbinding

The keyboard listener SHALL be installed when the component using `useKeyboardShortcuts` mounts, and SHALL be removed when the component unmounts, leaving no leaked event listeners.

#### Scenario: Listener removed on unmount

- **WHEN** a component using `useKeyboardShortcuts` is unmounted AND the user presses a shortcut key afterward
- **THEN** the previously-registered handlers SHALL NOT be invoked

### Requirement: Discoverable help modal

The system SHALL expose a help modal listing every keyboard binding so users can discover them without external documentation.

#### Scenario: Help button opens the modal

- **WHEN** the user clicks the `?` button in the controls bar
- **THEN** the keyboard-help modal SHALL appear

#### Scenario: Modal closeable via overlay click

- **WHEN** the help modal is open AND the user clicks the modal overlay (outside the modal body)
- **THEN** the modal SHALL emit `close` and disappear

#### Scenario: Modal closeable via close button

- **WHEN** the help modal is open AND the user clicks the close button inside the modal header
- **THEN** the modal SHALL emit `close` and disappear

#### Scenario: Modal lists all bindings

- **WHEN** the help modal is rendered
- **THEN** it SHALL include rows for at least: `Space`, `T`, `R`, `1 / 2`, `F1〜F4`, `D / H`, `?`, `Escape`

