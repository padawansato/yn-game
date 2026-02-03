## MODIFIED Requirements

### Requirement: Stationary movement pattern (Lizardman)
Lizardman SHALL establish a nest and patrol around it by moving one cell at a time.

#### Scenario: Nest establishment
- **WHEN** a Lizardman finds an open area (2x3 tiles or larger contiguous space)
- **THEN** it SHALL establish that location as its nest

#### Scenario: No nest behavior
- **WHEN** a Lizardman has no nest
- **THEN** it SHALL move using straight pattern (like Nijirigoke) without turning at walls

#### Scenario: Nest patrol
- **WHEN** a Lizardman has a nest
- **THEN** it SHALL move one cell at a time within the patrol range (within 2 cells of nest)

#### Scenario: Patrol movement selection
- **WHEN** a Lizardman chooses its next patrol position
- **THEN** it SHALL randomly select from adjacent valid cells that are within patrol range

#### Scenario: Patrol blocked
- **WHEN** a Lizardman has no valid adjacent cells within patrol range
- **THEN** it SHALL stay in place

#### Scenario: Hungry stationary
- **WHEN** a Lizardman is hungry and prey is detected nearby
- **THEN** it SHALL prioritize moving toward adjacent cells in the prey direction while staying within patrol range
