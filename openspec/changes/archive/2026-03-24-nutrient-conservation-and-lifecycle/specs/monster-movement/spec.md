## MODIFIED Requirements

### Requirement: Straight movement pattern (Nijirigoke)
Nijirigoke in 'mobile' phase SHALL move in a straight line until hitting a wall. Nijirigoke in other phases SHALL not move.

#### Scenario: Straight movement (mobile phase)
- **WHEN** a Nijirigoke in 'mobile' phase has open path ahead
- **THEN** it SHALL continue moving in its current direction

#### Scenario: Wall collision (mobile phase)
- **WHEN** a Nijirigoke in 'mobile' phase hits a wall or obstacle
- **THEN** it SHALL randomly choose to turn right, left, or back AND immediately move in that direction

#### Scenario: Bud/flower/withered immobility
- **WHEN** a Nijirigoke is in 'bud', 'flower', or 'withered' phase
- **THEN** it SHALL NOT move (skip movement calculation entirely)

### Requirement: Refraction movement pattern (Gajigajimushi)
Gajigajimushi in 'larva' or 'adult' phase SHALL always turn when possible. Gajigajimushi in 'pupa' phase SHALL not move.

#### Scenario: Turn when possible (larva/adult)
- **WHEN** a Gajigajimushi in 'larva' or 'adult' phase can turn left or right
- **THEN** it SHALL turn (random choice if both available)

#### Scenario: Pupa immobility
- **WHEN** a Gajigajimushi is in 'pupa' phase
- **THEN** it SHALL NOT move (skip movement calculation entirely)

#### Scenario: Hungry refraction (larva/adult)
- **WHEN** a Gajigajimushi in 'larva' or 'adult' phase is hungry and prey is detected in a direction
- **THEN** it SHALL prioritize that direction over normal refraction behavior

### Requirement: Stationary movement pattern (Lizardman)
Lizardman in 'normal' or 'nesting' phase SHALL establish a nest and patrol. Lizardman in 'laying' phase and eggs SHALL not move.

#### Scenario: Nest patrol (normal/nesting)
- **WHEN** a Lizardman in 'normal' or 'nesting' phase has a nest
- **THEN** it SHALL move one cell at a time within the patrol range (within 2 cells of nest)

#### Scenario: Laying immobility
- **WHEN** a Lizardman is in 'laying' phase
- **THEN** it SHALL NOT move (skip movement calculation entirely)

#### Scenario: Egg immobility
- **WHEN** an entity is in 'egg' phase
- **THEN** it SHALL NOT move

### Requirement: Movement tick
All monsters SHALL move simultaneously on each game tick, respecting phase-based immobility.

#### Scenario: Simultaneous movement
- **WHEN** a game tick occurs
- **THEN** all monsters in mobile phases SHALL calculate and execute their movement in parallel

#### Scenario: Immobile monsters excluded
- **WHEN** a game tick calculates movement
- **THEN** monsters in immobile phases (bud, flower, withered, pupa, laying, egg) SHALL be excluded from movement calculation
