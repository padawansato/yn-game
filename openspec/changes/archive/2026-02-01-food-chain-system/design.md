## Context

yn-game is a simplified web version of "Yuusha no Kuse ni Namaiki da" (No Heroes Allowed). Based on CEDEC 2008 presentation insights:

- "Self-organization does not work. Player involvement is necessary."
- "The world inevitably perishes - that's what makes it a resource management game."
- "AI should be simple enough for players to understand and predict."

Current state: Empty project. Foundation needs to be built from scratch.

## Goals / Non-Goals

**Goals:**
- Implement authentic food chain mechanics based on original game design
- Three movement patterns: straight (Nijirigoke), refraction (Gajigajimushi), stationary (Lizardman)
- Nutrient system that depletes over time (no regeneration)
- Predation on contact (same cell), not adjacency
- Life decreases with movement, recovered by eating

**Non-Goals:**
- UI components (separate change)
- Hero/enemy system (separate change)
- Fourth monster type (Daemon) - too complex for MVP
- Sound and animation

## Decisions

### Decision 1: Movement Pattern Implementation

```typescript
type MovementPattern = 'straight' | 'refraction' | 'stationary';

interface MovementStrategy {
  getNextMove(monster: Monster, grid: Grid): Position | null;
}

const strategies: Record<MovementPattern, MovementStrategy> = {
  straight: new StraightMovement(),
  refraction: new RefractionMovement(),
  stationary: new StationaryMovement(),
};
```

**Rationale**: Strategy pattern allows easy extension and testing of each movement type independently.

### Decision 2: Tick-based Simulation

```typescript
function tick(state: GameState): GameState {
  // 1. Calculate all monster movements
  const moves = calculateMoves(state);

  // 2. Check predation (same cell)
  const predationEvents = checkPredation(moves, state);

  // 3. Apply movements and predation
  const newState = applyChanges(state, moves, predationEvents);

  // 4. Decrease life for all moved monsters
  return decreaseLife(newState);
}
```

**Rationale**: Simultaneous tick prevents order-dependent behavior. Matches original game design.

### Decision 3: Nutrient as Separate Entity

```typescript
interface Nutrient {
  id: string;
  position: Position;
  amount: number;
  carriedBy: string | null; // Monster ID or null if on ground
}
```

**Rationale**: Nutrients exist independently, can be carried by Nijirigoke. Enables tracking total nutrients for world death condition.

### Decision 4: Hunger-Driven Behavior

```typescript
function getMovePriority(monster: Monster, grid: Grid): Direction[] {
  const defaultPriority = getPatternPriority(monster.pattern);

  if (monster.life < monster.maxLife * 0.3) {
    // Hungry: prioritize directions with prey
    return prioritizePreyDirections(monster, grid, defaultPriority);
  }

  return defaultPriority;
}
```

**Rationale**: Hunger state changes behavior without changing movement pattern. Creates emergent gameplay.

## Risks / Trade-offs

**[Risk] Balancing nutrient depletion rate**
→ Mitigation: Configurable depletion ratio (default 30% lost on dig). Can tune during playtesting.

**[Risk] Stationary pattern complexity (nest finding)**
→ Mitigation: Simple implementation first - treat any current position as potential nest. Enhance if needed.

**[Risk] Simultaneous movement conflicts**
→ Mitigation: Priority rules - predation first, then random resolution for same-destination conflicts.

## File Structure

```
src/core/
├── types.ts           # Monster, Nutrient, Grid types
├── constants.ts       # Tunable game parameters
├── nutrient.ts        # Nutrient pool, carrying, depletion
├── movement/
│   ├── index.ts       # Movement tick orchestration
│   ├── straight.ts    # Nijirigoke pattern
│   ├── refraction.ts  # Gajigajimushi pattern
│   └── stationary.ts  # Lizardman pattern
├── predation.ts       # Contact-based predation
└── simulation.ts      # Main tick function
```
