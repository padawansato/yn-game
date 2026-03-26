import type { GameState, GameEvent, Direction } from '../types'
import type { HeroEntity, HeroSpawnConfig } from './types'
import {
  HERO_LIFE,
  HERO_ATTACK,
  HERO_ANNOUNCE_TICKS,
} from '../constants'

const DIRECTIONS: Direction[] = ['up', 'down', 'left', 'right']

export function processHeroSpawns(
  state: GameState,
  randomFn: () => number = () => Math.floor(Math.random() * 4),
): {
  heroes: HeroEntity[]
  events: GameEvent[]
  heroSpawnConfig: HeroSpawnConfig
  nextHeroId: number
} {
  const { gameTime, entrancePosition, heroSpawnConfig, nextHeroId } = state
  const { partySize, spawnStartTick, spawnInterval, heroesSpawned } = heroSpawnConfig
  const heroes: HeroEntity[] = []
  const events: GameEvent[] = []

  // No spawn if demon lord not placed
  if (!state.demonLordPosition) {
    return { heroes, events, heroSpawnConfig: { ...heroSpawnConfig }, nextHeroId }
  }

  // Party announcement
  const announceTick = spawnStartTick - HERO_ANNOUNCE_TICKS
  if (gameTime === announceTick && heroesSpawned === 0) {
    events.push({
      type: 'HERO_PARTY_ANNOUNCED',
      partySize,
      spawnStartTick,
    })
    return {
      heroes,
      events,
      heroSpawnConfig: { ...heroSpawnConfig },
      nextHeroId,
    }
  }

  // All heroes already spawned
  if (heroesSpawned >= partySize) {
    return {
      heroes,
      events,
      heroSpawnConfig: { ...heroSpawnConfig },
      nextHeroId,
    }
  }

  // Check if this tick is a spawn tick for the next hero
  const expectedSpawnTick = spawnStartTick + heroesSpawned * spawnInterval
  if (gameTime !== expectedSpawnTick) {
    return {
      heroes,
      events,
      heroSpawnConfig: { ...heroSpawnConfig },
      nextHeroId,
    }
  }

  // Spawn hero
  const newHeroId = nextHeroId + 1
  const hero: HeroEntity = {
    kind: 'hero',
    id: `hero-${newHeroId}`,
    position: { ...entrancePosition },
    direction: DIRECTIONS[Math.floor(randomFn() * 4) % 4],
    life: HERO_LIFE,
    maxLife: HERO_LIFE,
    attack: HERO_ATTACK,
    attackPattern: 'slash',
    visitedCells: new Set([`${entrancePosition.x},${entrancePosition.y}`]),
    pathHistory: [{ ...entrancePosition }],
    state: 'exploring',
    targetFound: false,
  }

  heroes.push(hero)
  events.push({
    type: 'HERO_SPAWNED',
    heroId: hero.id,
    position: { ...entrancePosition },
  })

  return {
    heroes,
    events,
    heroSpawnConfig: {
      ...heroSpawnConfig,
      heroesSpawned: heroesSpawned + 1,
    },
    nextHeroId: newHeroId,
  }
}
