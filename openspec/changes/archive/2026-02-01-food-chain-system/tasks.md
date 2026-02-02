## 1. Project Foundation

- [x] 1.1 Initialize Vite + Vue 3 + TypeScript project
- [x] 1.2 Set up Vitest
- [x] 1.3 Configure ESLint + Prettier

## 2. Core Types

- [x] 2.1 Create src/core/types.ts with Position, Direction types
- [x] 2.2 Define Monster type with life, maxLife, pattern, direction, predationTargets
- [x] 2.3 Define Nutrient type with position, amount, carriedBy
- [x] 2.4 Define Grid and Cell types
- [x] 2.5 Define GameState type
- [x] 2.6 Define GameEvent union type (PREDATION, DEATH, WORLD_DYING, etc.)

## 3. Constants and Configuration

- [x] 3.1 Create src/core/constants.ts
- [x] 3.2 Define monster stats (life, attack, patterns) for each type
- [x] 3.3 Define nutrient depletion ratio (default 0.3)
- [x] 3.4 Define hunger threshold (default 0.3 of maxLife)

## 4. Nutrient System

- [x] 4.1 Create src/core/nutrient.ts
- [x] 4.2 Implement initializeNutrients (distribute fixed amount to soil)
- [x] 4.3 Implement depleteOnDig (lose 30% when digging)
- [x] 4.4 Implement pickupNutrient (Nijirigoke picks up)
- [x] 4.5 Implement depositNutrient (Nijirigoke drops)
- [x] 4.6 Implement getTotalNutrients (for world death check)
- [x] 4.7 Create unit tests for nutrient system

## 5. Movement - Straight Pattern

- [x] 5.1 Create src/core/movement/straight.ts
- [x] 5.2 Implement moveForward logic
- [x] 5.3 Implement wallCollision with random turn (right/left/back)
- [x] 5.4 Implement nutrient interaction (pick up / deposit)
- [x] 5.5 Create unit tests for straight movement

## 6. Movement - Refraction Pattern

- [x] 6.1 Create src/core/movement/refraction.ts
- [x] 6.2 Implement alwaysTurn logic (turn when possible)
- [x] 6.3 Implement randomTurnChoice (when both left/right available)
- [x] 6.4 Implement uTurn (when stuck)
- [x] 6.5 Create unit tests for refraction movement

## 7. Movement - Stationary Pattern

- [x] 7.1 Create src/core/movement/stationary.ts
- [x] 7.2 Implement nestEstablishment (find open area)
- [x] 7.3 Implement patrolBehavior (around nest)
- [x] 7.4 Implement noNestFallback (use straight pattern)
- [x] 7.5 Create unit tests for stationary movement

## 8. Hunger System

- [x] 8.1 Add hunger detection to movement/index.ts
- [x] 8.2 Implement detectPrey (find prey in each direction)
- [x] 8.3 Implement prioritizePreyDirection (override normal movement)
- [x] 8.4 Create unit tests for hunger behavior

## 9. Predation System

- [x] 9.1 Create src/core/predation.ts
- [x] 9.2 Implement checkSameCellPredation
- [x] 9.3 Implement predationHierarchy validation
- [x] 9.4 Implement lifeRecovery (predator gains prey's life)
- [x] 9.5 Implement preyRemoval with nutrient drop
- [x] 9.6 Create unit tests for predation

## 10. Simulation Tick

- [x] 10.1 Create src/core/simulation.ts
- [x] 10.2 Implement calculateAllMoves (parallel movement calculation)
- [x] 10.3 Implement resolveConflicts (predation first, then random)
- [x] 10.4 Implement applyMovements
- [x] 10.5 Implement decreaseLifeForMoved
- [x] 10.6 Implement tick function (orchestrate all steps)
- [x] 10.7 Create integration tests for full tick cycle

## 11. Dig Action

- [x] 11.1 Add dig function to simulation.ts
- [x] 11.2 Implement soil validation
- [x] 11.3 Implement Nijirigoke spawn with nutrient-based life
- [x] 11.4 Create unit tests for dig action

## 12. Events and Export

- [x] 12.1 Implement event emission throughout system
- [x] 12.2 Create src/core/index.ts with clean exports
- [x] 12.3 Final integration test: multiple ticks with dig, movement, predation
