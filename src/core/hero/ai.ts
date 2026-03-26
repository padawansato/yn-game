import type { GameState, GameEvent, Position, Direction } from '../types'
import type { HeroEntity } from './types'

function getAdjacentPosition(pos: Position, dir: Direction): Position {
  switch (dir) {
    case 'up':
      return { x: pos.x, y: pos.y - 1 }
    case 'down':
      return { x: pos.x, y: pos.y + 1 }
    case 'left':
      return { x: pos.x - 1, y: pos.y }
    case 'right':
      return { x: pos.x + 1, y: pos.y }
  }
}

function isPassable(pos: Position, grid: { type: string }[][]): boolean {
  if (pos.y < 0 || pos.y >= grid.length || pos.x < 0 || pos.x >= grid[0].length) {
    return false
  }
  return grid[pos.y][pos.x].type === 'empty'
}

function turnLeft(dir: Direction): Direction {
  const map: Record<Direction, Direction> = { up: 'left', left: 'down', down: 'right', right: 'up' }
  return map[dir]
}

function turnRight(dir: Direction): Direction {
  const map: Record<Direction, Direction> = { up: 'right', right: 'down', down: 'left', left: 'up' }
  return map[dir]
}

function turnBack(dir: Direction): Direction {
  const map: Record<Direction, Direction> = { up: 'down', down: 'up', left: 'right', right: 'left' }
  return map[dir]
}

function directionFromTo(from: Position, to: Position): Direction {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (dy < 0) return 'up'
  if (dy > 0) return 'down'
  if (dx < 0) return 'left'
  return 'right'
}

function posKey(pos: Position): string {
  return `${pos.x},${pos.y}`
}

export function calculateHeroMove(
  hero: HeroEntity,
  state: GameState,
  randomFn: () => number = Math.random,
): { hero: HeroEntity; events: GameEvent[] } {
  const events: GameEvent[] = []

  if (hero.state === 'returning') {
    return handleReturning(hero, state, events)
  }

  return handleExploring(hero, state, events, randomFn)
}

function handleExploring(
  hero: HeroEntity,
  state: GameState,
  events: GameEvent[],
  randomFn: () => number,
): { hero: HeroEntity; events: GameEvent[] } {
  const { grid } = state
  const forward = getAdjacentPosition(hero.position, hero.direction)

  // Try forward if passable and unvisited
  if (isPassable(forward, grid) && !hero.visitedCells.has(posKey(forward))) {
    return moveToCell(hero, forward, hero.direction, state, events)
  }

  // Collect unvisited passable neighbors from left, right, back
  const candidates: { pos: Position; dir: Direction }[] = []
  for (const dir of [turnLeft(hero.direction), turnRight(hero.direction), turnBack(hero.direction)]) {
    const pos = getAdjacentPosition(hero.position, dir)
    if (isPassable(pos, grid) && !hero.visitedCells.has(posKey(pos))) {
      candidates.push({ pos, dir })
    }
  }

  if (candidates.length > 0) {
    const idx = Math.floor(randomFn() * candidates.length)
    const chosen = candidates[idx]
    return moveToCell(hero, chosen.pos, chosen.dir, state, events)
  }

  // Backtrack: all passable neighbors visited
  return handleBacktrack(hero, state, events)
}

function moveToCell(
  hero: HeroEntity,
  newPos: Position,
  newDir: Direction,
  state: GameState,
  events: GameEvent[],
): { hero: HeroEntity; events: GameEvent[] } {
  const newVisited = new Set(hero.visitedCells)
  newVisited.add(posKey(newPos))
  const newPath = [...hero.pathHistory, newPos]

  // Check demon lord discovery
  if (state.demonLordPosition && newPos.x === state.demonLordPosition.x && newPos.y === state.demonLordPosition.y) {
    events.push({ type: 'DEMON_LORD_FOUND', heroId: hero.id })
    return {
      hero: {
        ...hero,
        position: newPos,
        direction: newDir,
        visitedCells: newVisited,
        pathHistory: newPath,
        state: 'returning',
        targetFound: true,
      },
      events,
    }
  }

  return {
    hero: {
      ...hero,
      position: newPos,
      direction: newDir,
      visitedCells: newVisited,
      pathHistory: newPath,
    },
    events,
  }
}

function handleBacktrack(
  hero: HeroEntity,
  state: GameState,
  events: GameEvent[],
): { hero: HeroEntity; events: GameEvent[] } {
  const newPath = [...hero.pathHistory]
  // Pop current position
  newPath.pop()

  if (newPath.length === 0) {
    // Nowhere to go - stay in place
    return { hero: { ...hero }, events }
  }

  const target = newPath[newPath.length - 1]
  const newDir = directionFromTo(hero.position, target)

  return {
    hero: {
      ...hero,
      position: target,
      direction: newDir,
      pathHistory: newPath,
    },
    events,
  }
}

function handleReturning(
  hero: HeroEntity,
  state: GameState,
  events: GameEvent[],
): { hero: HeroEntity; events: GameEvent[] } {
  const newPath = [...hero.pathHistory]
  // Pop current position
  newPath.pop()

  if (newPath.length === 0) {
    return { hero: { ...hero }, events }
  }

  const target = newPath[newPath.length - 1]
  const newDir = directionFromTo(hero.position, target)

  const updatedHero: HeroEntity = {
    ...hero,
    position: target,
    direction: newDir,
    pathHistory: newPath,
  }

  // Check if reached entrance
  if (target.x === state.entrancePosition.x && target.y === state.entrancePosition.y) {
    events.push({ type: 'HERO_ESCAPED', heroId: hero.id })
  }

  return { hero: updatedHero, events }
}
