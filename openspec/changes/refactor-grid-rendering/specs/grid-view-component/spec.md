## ADDED Requirements

### Requirement: GridView component boundary

The system SHALL provide a Vue component `GridView.vue` that encapsulates grid rendering. The component SHALL accept `gameState` and `config` as props and SHALL emit `cell-click` events with cell coordinates. GridView SHALL NOT interpret click semantics (dig, demon-lord placement, etc.); those belong to the parent component.

#### Scenario: Component receives game state via props

- **WHEN** `GridView` is mounted with `gameState` and `config` props
- **THEN** it SHALL render the grid based on `gameState.grid` dimensions and contents
- **AND** the rendered visuals SHALL be consistent with `App.vue` prior to extraction (same DOM structure, same classes, same textual content)

#### Scenario: Parent receives cell-click events

- **WHEN** a user clicks a cell within `GridView`
- **THEN** `GridView` SHALL emit `cell-click` with the cell's `x` and `y` coordinates as an object `{ x: number, y: number }`
- **AND** `GridView` SHALL NOT call `dig`, mutate game state, or interpret the click in any other way

### Requirement: DOM structure compatibility

GridView SHALL render the grid using the DOM structure `.grid > .row > .cell`, preserving the CSS class names used by `App.vue` prior to extraction. Existing end-to-end tests that rely on these selectors SHALL continue to pass without modification.

#### Scenario: Existing E2E selectors continue to match

- **WHEN** an existing E2E test queries selectors such as `.cell`, `.cell-wall`, `.cell-soil`, `.cell-empty`, `.cell-content`, `.monster-nijirigoke`, `.monster-gajigajimushi`, `.monster-lizardman`, `.hero-cell`, `.hero-returning`, `.demon-lord-cell`, `.entrance-cell`, `.nest-cell`, `.nijirigoke-bud`, `.nijirigoke-flower`, `.nijirigoke-withered`, `.overlap-badge`, or `.nutrient-indicator`
- **THEN** those selectors SHALL match elements rendered by `GridView` in the same way they matched elements rendered by `App.vue` before the refactor

### Requirement: Cell display logic co-location

GridView SHALL contain the display-related helper logic that determines what each cell renders: `getCellClass`, `getCellDisplay`, `nestCellSet`, and `getTopMonster`. These helpers SHALL be unit-testable, either as methods of the component or as pure functions imported by it.

#### Scenario: getCellClass reflects hero state

- **WHEN** `getCellClass` is applied to a cell containing a hero in `exploring` state
- **THEN** the returned class string SHALL include `hero-cell`
- **AND** SHALL NOT include `hero-returning`

#### Scenario: getCellClass reflects returning hero

- **WHEN** `getCellClass` is applied to a cell containing a hero in `returning` state
- **THEN** the returned class string SHALL include both `hero-cell` and `hero-returning`

#### Scenario: getCellDisplay reflects nijirigoke phase

- **WHEN** `getCellDisplay` is applied to a cell containing a nijirigoke in phase `bud`, `flower`, or `withered`
- **THEN** the returned string SHALL be `蕾`, `花`, or `枯` respectively
- **AND** for phase `mobile` the returned string SHALL be `苔`

#### Scenario: nestCellSet reflects nesting lizardmen

- **WHEN** the game state contains a lizardman with a defined `nestPosition` and `nestOrientation`
- **THEN** `nestCellSet` SHALL include the coordinates of all nest cells computed by `getNestCells(nestPosition, nestOrientation)`

### Requirement: Legend rendering

GridView SHALL render both the entity legend and the nutrient legend as children of its output. The content and structure of the legends SHALL match the legends previously rendered by `App.vue`.

#### Scenario: Both legends are present

- **WHEN** `GridView` is mounted with a valid game state
- **THEN** the rendered output SHALL contain exactly two `.legend` elements
- **AND** one of them SHALL have the class `nutrient-legend` in addition to `legend`

### Requirement: Size-agnostic rendering

GridView SHALL correctly render grids of any dimensions determined by `gameState.grid` without hardcoded size assumptions. The component SHALL function identically for small, medium, and large grids, both in structural output and visual logic.

#### Scenario: Parametric rendering at multiple sizes

- **WHEN** `GridView` is rendered with `gameState.grid` of sizes 5×5, 10×8, 20×15, and 30×40 respectively
- **THEN** in each case the number of `.row` elements SHALL equal the grid height
- **AND** the number of `.cell` elements per row SHALL equal the grid width
- **AND** the cell content and classes SHALL reflect the cell state at each coordinate
- **AND** no assertion SHALL rely on fixed coordinate values that are only valid at one size

### Requirement: Grid size SSoT via GameConfig

The system SHALL NOT hardcode grid dimensions in `src/App.vue` or in UI scenario setup functions. All grid sizes used by the UI SHALL be derived from `GameConfig.grid.defaultWidth` and `GameConfig.grid.defaultHeight`, either directly or via a spread override of the base config.

#### Scenario: Initial game state uses GameConfig

- **WHEN** `App.vue` initializes the game state on startup
- **THEN** it SHALL call `createGameState` using `config.grid.defaultWidth` and `config.grid.defaultHeight` rather than literal numbers
- **AND** `config` SHALL be obtained from `createDefaultConfig()`

#### Scenario: UI scenario uses spread override

- **WHEN** a UI scenario setup function needs a grid of a size different from the base config
- **THEN** it SHALL construct a scenario-specific config as `{ ...baseConfig, grid: { ...baseConfig.grid, defaultWidth: N, defaultHeight: M } }` and use that config to create the scenario game state
- **AND** it SHALL NOT call `makeEmptyArena` (or any equivalent helper) with hardcoded literal dimensions

#### Scenario: constants.ts values flow through

- **WHEN** `createDefaultConfig()` is called
- **THEN** the returned config's `grid.defaultWidth` SHALL equal `DEFAULT_GRID_WIDTH` from `src/core/constants.ts`
- **AND** the returned config's `grid.defaultHeight` SHALL equal `DEFAULT_GRID_HEIGHT` from `src/core/constants.ts`
- **AND** the `App.vue` initial render SHALL use those values, resulting in a 20×15 grid by default
