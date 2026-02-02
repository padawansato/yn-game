## ADDED Requirements

### Requirement: Overlap count display
The UI SHALL display the count of overlapping entities when multiple entities occupy the same cell.

#### Scenario: Single entity display
- **WHEN** a cell contains exactly one entity (monster or nutrient)
- **THEN** the UI SHALL display only that entity's icon without a count indicator

#### Scenario: Multiple monsters overlap
- **WHEN** a cell contains 2 or more monsters
- **THEN** the UI SHALL display the topmost monster's icon with a count badge showing the total number of monsters

#### Scenario: Monster and nutrient overlap
- **WHEN** a cell contains both a monster and a nutrient entity
- **THEN** the UI SHALL display the monster icon (monster takes visual priority) with a count badge showing total entities

#### Scenario: Count badge visibility
- **WHEN** a count badge is displayed
- **THEN** the badge SHALL show the number in a visually distinct style (e.g., small superscript or corner indicator)

### Requirement: Overlap priority order
The UI SHALL follow a consistent priority order when determining which entity to display as the primary icon.

#### Scenario: Display priority
- **WHEN** multiple entities occupy the same cell
- **THEN** the display priority SHALL be: Lizardman > Gajigajimushi > Nijirigoke > Nutrient

#### Scenario: Same type overlap
- **WHEN** multiple entities of the same type occupy the same cell
- **THEN** the UI SHALL display one icon of that type with the count badge
