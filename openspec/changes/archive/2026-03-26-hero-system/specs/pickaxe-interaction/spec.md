## MODIFIED Requirements

### Requirement: Pickaxe damage to monsters
The player SHALL be able to deal fixed damage to monsters by left-clicking on them with the pickaxe. Hero entities SHALL be immune to pickaxe damage.

#### Scenario: Left-click deals damage
- **WHEN** the player left-clicks on a cell containing a monster
- **THEN** the monster's life SHALL decrease by the fixed pickaxe damage value

#### Scenario: Monster death from pickaxe
- **WHEN** pickaxe damage reduces a monster's life to 0 or below
- **THEN** the monster SHALL die and nutrients SHALL be released following the conservation law (9-cell distribution)

#### Scenario: No digPower consumption
- **WHEN** the player attacks a monster with the pickaxe
- **THEN** digPower SHALL NOT be consumed

#### Scenario: Hero is immune to pickaxe
- **WHEN** the player attempts to use the pickaxe on a hero entity
- **THEN** no damage SHALL be dealt and no event SHALL be emitted

#### Scenario: Multiple monsters in same cell
- **WHEN** the player left-clicks a cell containing multiple monsters
- **THEN** damage SHALL be dealt to the first (topmost) monster only
