## MODIFIED Requirements

### Requirement: Flower attack (moyomoyo) — replace (FUTURE) with implementation

#### Scenario: Flower attack capability
- **WHEN** a Nijirigoke is in 'flower' phase during a tick
- **THEN** it SHALL deal MOYOMOYO_DAMAGE to all gajigajimushi within surrounding 9 cells (8 adjacent + center)

#### Scenario: Flower attack target
- **WHEN** a moyomoyo attack hits a monster
- **THEN** the target's life SHALL decrease by MOYOMOYO_DAMAGE (2)
- **AND** a MOYOMOYO_ATTACK event SHALL be emitted

#### Scenario: Flower attack kill
- **WHEN** a moyomoyo attack reduces a target's life to 0 or below
- **THEN** the target SHALL die and release nutrients per conservation law

### Requirement: Shared nests — replace (FUTURE) with implementation

#### Scenario: Shared nest detection
- **WHEN** a Lizardman without a nest cannot afford to build a new nest (carryingNutrient < NEST_NUTRIENT_COST)
- **THEN** it SHALL search for existing nests belonging to other Lizardmen

#### Scenario: Shared nest adoption
- **WHEN** a nestless Lizardman detects an existing nest from another Lizardman
- **THEN** it SHALL adopt that nest (copy nestPosition and nestOrientation) without paying nest building cost

#### Scenario: Own nest priority
- **WHEN** a Lizardman can afford to build its own nest (carryingNutrient >= NEST_NUTRIENT_COST)
- **THEN** it SHALL build its own nest rather than sharing

## REMOVED Requirements

### Laying interruption by attack
- **REMOVED**: This scenario is deleted. In the original game, laying continues even when taking combat damage. The laying interruption spec was incorrect.
