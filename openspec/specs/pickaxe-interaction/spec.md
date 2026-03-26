# Pickaxe Interaction

## Purpose

ツルハシによるモンスターへの攻撃・インスペクション機能。

## Requirements

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

### Requirement: Pickaxe damage configuration
The pickaxe damage value SHALL be configurable as a constant.

#### Scenario: Default damage value
- **WHEN** the game uses default configuration
- **THEN** the pickaxe damage SHALL be a fixed positive integer (tunable constant)

### Requirement: Monster inspection via right-click
The player SHALL be able to inspect monster parameters by right-clicking on them.

#### Scenario: Right-click shows parameters
- **WHEN** the player right-clicks on a cell containing a monster
- **THEN** a popup/tooltip SHALL display the monster's type, life/maxLife, and carryingNutrient

#### Scenario: Right-click on empty cell
- **WHEN** the player right-clicks on a cell with no monster
- **THEN** no popup SHALL be shown

#### Scenario: Popup dismissal
- **WHEN** a monster parameter popup is visible
- **THEN** the popup SHALL be dismissed when the player clicks elsewhere or after a timeout

### Requirement: Pickaxe attack event emission
The system SHALL emit events when the pickaxe is used on monsters.

#### Scenario: Attack event
- **WHEN** the player attacks a monster with the pickaxe
- **THEN** the system SHALL emit a MONSTER_ATTACKED event with monster ID, damage dealt, and remaining life
