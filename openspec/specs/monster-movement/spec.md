# Monster Movement

## Purpose

モンスターの移動パターンを定義するシステム。各モンスター種別ごとに異なる移動パターンを持つ。

## Requirements

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

#### Scenario: Completely stuck
- **WHEN** a Nijirigoke is surrounded by walls on all sides
- **THEN** it SHALL stay in place (only case where it doesn't move)

### Requirement: Refraction movement pattern (Gajigajimushi)
Gajigajimushi in 'larva' or 'adult' phase SHALL always turn when possible. Gajigajimushi in 'pupa' phase SHALL not move.

#### Scenario: Turn when possible (larva/adult)
- **WHEN** a Gajigajimushi in 'larva' or 'adult' phase can turn left or right
- **THEN** it SHALL turn (random choice if both available)

#### Scenario: Pupa immobility
- **WHEN** a Gajigajimushi is in 'pupa' phase
- **THEN** it SHALL NOT move (skip movement calculation entirely)

#### Scenario: Continue if no turn
- **WHEN** a Gajigajimushi cannot turn but can go forward
- **THEN** it SHALL continue forward

#### Scenario: U-turn when stuck
- **WHEN** a Gajigajimushi cannot turn or go forward
- **THEN** it SHALL make a U-turn

#### Scenario: Hungry refraction (larva/adult)
- **WHEN** a Gajigajimushi in 'larva' or 'adult' phase is hungry and prey is detected in a direction
- **THEN** it SHALL prioritize that direction over normal refraction behavior

### Requirement: Stationary movement pattern (Lizardman)
Lizardman in 'normal' or 'nesting' phase SHALL establish a nest and patrol. Lizardman in 'laying' phase and eggs SHALL not move.

#### Scenario: Nest establishment
- **WHEN** a Lizardman finds an open area (2x3 tiles or larger contiguous space)
- **THEN** it SHALL establish that location as its nest

#### Scenario: No nest behavior
- **WHEN** a Lizardman has no nest
- **THEN** it SHALL move using straight pattern (like Nijirigoke) without turning at walls

#### Scenario: Nest patrol (normal/nesting)
- **WHEN** a Lizardman in 'normal' or 'nesting' phase has a nest
- **THEN** it SHALL move one cell at a time within the patrol range (within 2 cells of nest)

#### Scenario: Patrol movement selection
- **WHEN** a Lizardman chooses its next patrol position
- **THEN** it SHALL randomly select from adjacent valid cells that are within patrol range

#### Scenario: Patrol blocked
- **WHEN** a Lizardman has no valid adjacent cells within patrol range
- **THEN** it SHALL stay in place

#### Scenario: Laying immobility
- **WHEN** a Lizardman is in 'laying' phase
- **THEN** it SHALL NOT move (skip movement calculation entirely)

#### Scenario: Egg immobility
- **WHEN** an entity is in 'egg' phase
- **THEN** it SHALL NOT move

#### Scenario: Hungry stationary
- **WHEN** a Lizardman is hungry and prey is detected nearby
- **THEN** it SHALL prioritize moving toward adjacent cells in the prey direction while staying within patrol range

### Requirement: Movement tick
All monsters SHALL move simultaneously on each game tick, respecting phase-based immobility.

#### Scenario: Simultaneous movement
- **WHEN** a game tick occurs
- **THEN** all monsters in mobile phases SHALL calculate and execute their movement in parallel

#### Scenario: Immobile monsters excluded
- **WHEN** a game tick calculates movement
- **THEN** monsters in immobile phases (bud, flower, withered, pupa, laying, egg) SHALL be excluded from movement calculation

#### Scenario: Collision resolution
- **WHEN** two monsters attempt to occupy the same cell
- **THEN** predator-prey interaction SHALL be checked first, otherwise both stay in original positions
