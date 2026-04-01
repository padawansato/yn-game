# e2e-test-infrastructure Specification

## Purpose
TBD - created by archiving change e2e-test-repair. Update Purpose after archive.
## Requirements
### Requirement: E2E test execution via Docker Compose
The system SHALL provide a Docker Compose profile `e2e` that runs Playwright E2E tests against the running app service.

#### Scenario: Run E2E tests
- **WHEN** `docker compose --profile e2e run --rm e2e` is executed with the app service running
- **THEN** Playwright SHALL execute all test files in the `e2e/` directory and report results

#### Scenario: Playwright version compatibility
- **WHEN** the e2e service starts
- **THEN** the Playwright browser version SHALL match the `@playwright/test` version in `package.json`

### Requirement: Page Object Model for selector management
The system SHALL provide a `GamePage` helper class in `e2e/helpers/game-page.ts` that encapsulates all CSS selectors and common actions.

#### Scenario: Selector encapsulation
- **WHEN** an E2E test needs to interact with a game element (cell, button, status)
- **THEN** it SHALL use `GamePage` methods instead of hardcoding CSS selectors

#### Scenario: Cell identification by coordinates
- **WHEN** a test needs to interact with a specific grid cell at coordinates (x, y)
- **THEN** `GamePage.clickCell(x, y)` SHALL locate the cell using the title attribute `(x,y)`

#### Scenario: Deterministic tick advancement
- **WHEN** a test needs to advance the game by N ticks
- **THEN** `GamePage.advanceTicks(N)` SHALL click the Tick button N times sequentially

### Requirement: E2E npm script
The `package.json` SHALL include an `e2e` script for running Playwright tests.

#### Scenario: Run E2E via pnpm
- **WHEN** `pnpm e2e` is executed
- **THEN** Playwright tests SHALL run with the default configuration

