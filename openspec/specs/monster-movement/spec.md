## ADDED Requirements

### Requirement: Straight movement pattern (Nijirigoke)
Nijirigoke SHALL move in a straight line until hitting a wall.

#### Scenario: Straight movement
- **WHEN** a Nijirigoke with straight pattern has open path ahead
- **THEN** it SHALL continue moving in its current direction

#### Scenario: Wall collision
- **WHEN** a Nijirigoke hits a wall or obstacle
- **THEN** it SHALL randomly choose to turn right, left, or back AND immediately move in that direction (never stops)

#### Scenario: Completely stuck
- **WHEN** a Nijirigoke is surrounded by walls on all sides
- **THEN** it SHALL stay in place (only case where it doesn't move)

### Requirement: Refraction movement pattern (Gajigajimushi)
Gajigajimushi SHALL always turn when possible.

#### Scenario: Turn when possible
- **WHEN** a Gajigajimushi can turn left or right
- **THEN** it SHALL turn (random choice if both available)

#### Scenario: Continue if no turn
- **WHEN** a Gajigajimushi cannot turn but can go forward
- **THEN** it SHALL continue forward

#### Scenario: U-turn when stuck
- **WHEN** a Gajigajimushi cannot turn or go forward
- **THEN** it SHALL make a U-turn

#### Scenario: Hungry refraction
- **WHEN** a Gajigajimushi is hungry and prey is detected in a direction
- **THEN** it SHALL prioritize that direction over normal refraction behavior

### Requirement: Stationary movement pattern (Lizardman)
Lizardman SHALL establish a nest and patrol around it.

#### Scenario: Nest establishment
- **WHEN** a Lizardman finds an open area (3x3 or larger)
- **THEN** it SHALL establish that location as its nest

#### Scenario: No nest behavior
- **WHEN** a Lizardman has no nest
- **THEN** it SHALL move using straight pattern (like Nijirigoke)

#### Scenario: Nest patrol
- **WHEN** a Lizardman has a nest
- **THEN** it SHALL patrol cells adjacent to its nest

#### Scenario: Hungry stationary
- **WHEN** a Lizardman is hungry and prey is detected nearby
- **THEN** it SHALL move toward prey, temporarily leaving patrol area

### Requirement: Movement tick
All monsters SHALL move simultaneously on each game tick.

#### Scenario: Simultaneous movement
- **WHEN** a game tick occurs
- **THEN** all monsters SHALL calculate and execute their movement in parallel

#### Scenario: Collision resolution
- **WHEN** two monsters attempt to occupy the same cell
- **THEN** predator-prey interaction SHALL be checked first, otherwise both stay in original positions
