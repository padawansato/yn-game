## Why

The food chain system is the core mechanic of yn-game, a simplified version of "Yuusha no Kuse ni Namaiki da" (No Heroes Allowed). Based on CEDEC 2008 presentation by the original developers, the key insight is: "Self-organization does not work. Player involvement is necessary. That's what makes it a game."

The player can only dig. All NPCs are controlled by AI. Nutrients do not increase - the world will inevitably perish. This creates a resource management game where players must balance digging (to spawn monsters) against resource depletion.

## What Changes

- Implement nutrient system (nutrients don't increase, only circulate)
- Define monster types with distinct movement patterns (straight, refraction, stationary)
- Implement monster movement AI with hunger-driven behavior
- Implement predation when monsters touch prey (same cell)
- Life decreases with every movement action

## Capabilities

### New Capabilities

- `nutrient-system`: Nutrients are fixed at initial value. Moss carries nutrients. Digging depletes nutrients. World inevitably perishes.
- `monster-types`: Define monster types (Nijirigoke, Gajigajimushi, Lizardman) with movement patterns and predation targets
- `monster-movement`: Movement AI patterns - straight type, refraction type, stationary type. Hunger state prioritizes food direction.
- `predation-system`: When monster touches prey in same cell, it eats and recovers life. Life decreases with movement.

### Modified Capabilities

<!-- New project, no existing capabilities to modify -->

## Impact

- `src/core/types.ts`: Monster types with movement patterns, nutrient types
- `src/core/nutrient.ts`: Nutrient circulation logic
- `src/core/movement.ts`: Monster movement AI (straight, refraction, stationary)
- `src/core/predation.ts`: Predation on contact, life recovery
- Integration with game loop required
