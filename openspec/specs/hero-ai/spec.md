## ADDED Requirements

### Requirement: Exploration movement
In 'exploring' state, the hero SHALL move autonomously each tick, prioritizing unvisited cells. The hero SHALL record every cell it visits in visitedCells and append each position to pathHistory.

#### Scenario: Move to unvisited forward cell
- **WHEN** a hero is exploring and the cell in front is passable (empty) and unvisited
- **THEN** the hero SHALL move forward and add the new position to visitedCells and pathHistory

#### Scenario: Forward cell blocked or visited
- **WHEN** a hero is exploring and the forward cell is a wall or already visited
- **THEN** the hero SHALL check left, right, and back cells (in random order) for an unvisited passable cell and move there

#### Scenario: All adjacent cells visited
- **WHEN** a hero is exploring and all adjacent passable cells are visited
- **THEN** the hero SHALL backtrack by following pathHistory in reverse (popping the last entry and moving to it)

#### Scenario: Hero encounters soil
- **WHEN** a hero encounters a soil cell
- **THEN** the hero SHALL treat soil as impassable (heroes cannot dig)

#### Scenario: Visited cell tracking format
- **WHEN** a hero visits a cell at position (x, y)
- **THEN** the position SHALL be stored in visitedCells as the string "x,y"

### Requirement: Demon lord discovery
When the hero moves to the cell containing the demon lord flag, the hero SHALL transition to 'returning' state.

#### Scenario: Hero reaches demon lord
- **WHEN** a hero in 'exploring' state moves to the demon lord flag position
- **THEN** the hero's state SHALL change to 'returning', targetFound SHALL be true, and a DEMON_LORD_FOUND event SHALL be emitted

### Requirement: Return movement
In 'returning' state, the hero SHALL retrace its pathHistory in reverse order, moving one cell per tick toward the entrance.

#### Scenario: Return path following
- **WHEN** a hero is in 'returning' state
- **THEN** each tick the hero SHALL move to the previous position in pathHistory (popping from the end)

#### Scenario: Return with combat
- **WHEN** a returning hero encounters a monster in its front cell
- **THEN** the hero SHALL attack (per combat rules) and continue attempting to follow the return path

#### Scenario: Hero reaches entrance
- **WHEN** a returning hero arrives at the entrance position
- **THEN** the system SHALL emit a HERO_ESCAPED event and trigger the game over condition
