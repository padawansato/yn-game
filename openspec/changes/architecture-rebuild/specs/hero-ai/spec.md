## MODIFIED Requirements

### Requirement: Exploration movement
In 'exploring' state, the hero SHALL move autonomously each tick using the configured HeroAIStrategy, prioritizing unvisited cells. The hero SHALL record every cell it visits in visitedCells and append each position to pathHistory.

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

## ADDED Requirements

### Requirement: AI strategy abstraction
The hero AI SHALL be accessed through a HeroAIStrategy interface, allowing different AI implementations to be swapped via GameConfig.

#### Scenario: Rule-based AI (default)
- **WHEN** state.config.hero.aiType is 'rule-based' or undefined
- **THEN** the system SHALL use the existing exploration/return logic as-is

#### Scenario: AI strategy dispatch
- **WHEN** tick() processes hero movement
- **THEN** it SHALL resolve the HeroAIStrategy from state.config.hero.aiType and call strategy.calculateMove(hero, state)
