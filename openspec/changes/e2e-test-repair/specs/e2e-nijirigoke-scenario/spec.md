## ADDED Requirements

### Requirement: Phase transitions are observable
The E2E test SHALL verify that each nijirigoke phase lasts multiple ticks in the "ニジリゴケ変態" scenario.

#### Scenario: Each phase lasts multiple ticks
- **WHEN** the "ニジリゴケ変態" scenario is loaded and ticks advance
- **THEN** each phase (mobile, bud, flower, withered) SHALL persist for more than 1 tick before transitioning

### Requirement: Full phase progression
The E2E test SHALL verify that a nijirigoke completes the full lifecycle in the scenario.

#### Scenario: Mobile to withered progression
- **WHEN** the "ニジリゴケ変態" scenario is loaded and sufficient ticks advance
- **THEN** the nijirigoke SHALL progress through mobile (苔) → bud (蕾) → flower (花) → withered (枯) in order
