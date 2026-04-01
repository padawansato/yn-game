## ADDED Requirements

### Requirement: Front-cell attack
Each tick, every living hero and every living monster SHALL check the cell directly in front of their facing direction. If an enemy is present in that cell, the attacker SHALL deal damage equal to its attack value.

#### Scenario: Hero attacks monster in front cell
- **WHEN** a hero faces direction D and a monster is in the cell at D+1
- **THEN** the monster's life SHALL decrease by hero.attack

#### Scenario: Monster attacks hero in front cell
- **WHEN** a monster faces direction D and a hero is in the cell at D+1
- **THEN** the hero's life SHALL decrease by monster.attack

#### Scenario: No target in front cell
- **WHEN** an entity's front cell contains no enemy
- **THEN** no attack SHALL occur

#### Scenario: Zero attack value
- **WHEN** a monster with attack=0 (e.g., nijirigoke) has a hero in its front cell
- **THEN** no damage SHALL be dealt to the hero

### Requirement: Simultaneous damage resolution
All combat damage within a single tick SHALL be calculated simultaneously and then applied together.

#### Scenario: Mutual kill
- **WHEN** hero A faces monster B and monster B faces hero A, and both would reduce the other's life to 0
- **THEN** both SHALL die in the same tick (neither gets priority)

#### Scenario: Multiple attackers on same target
- **WHEN** two heroes face the same monster
- **THEN** the monster SHALL receive cumulative damage from both heroes in the same tick

### Requirement: Same-cell non-aggression (default)
By default, entities on the same cell SHALL NOT automatically attack each other. Same-cell attacks are reserved for future special attack patterns only.

#### Scenario: Hero and monster on same cell
- **WHEN** a hero and a monster occupy the same cell but neither faces the other's cell
- **THEN** no combat damage SHALL occur between them

#### Scenario: Passing through
- **WHEN** a hero moves onto a cell occupied by a monster (or vice versa) during movement
- **THEN** no combat SHALL be triggered by the co-occupation itself

### Requirement: Combat death processing
When an entity dies in combat, the system SHALL emit appropriate events and process death effects.

#### Scenario: Hero kills monster
- **WHEN** combat reduces a monster's life to 0 or below
- **THEN** the system SHALL emit HERO_COMBAT and MONSTER_DIED (cause: 'combat') events, and the monster's carryingNutrient SHALL be released via 9-cell distribution

#### Scenario: Monster kills hero
- **WHEN** combat reduces a hero's life to 0 or below
- **THEN** the system SHALL emit HERO_COMBAT and HERO_DIED events, and nutrients equal to HERO_NUTRIENT_DROP SHALL be added to surrounding cells as an external addition
