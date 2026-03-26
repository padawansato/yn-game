import { describe, it, expect } from 'vitest'
import { processHeroSpawns } from './spawn'
import { createGameState } from '../simulation'
import {
  HERO_LIFE,
  HERO_ATTACK,
  HERO_SPAWN_START_TICK,
  HERO_SPAWN_INTERVAL,
  HERO_ANNOUNCE_TICKS,
} from '../constants'
import type { GameState } from '../types'

function makeState(overrides: Partial<GameState> = {}): GameState {
  const state = createGameState(20, 15, 0.7, { demonLordPosition: { x: 10, y: 14 } })
  return { ...state, ...overrides }
}

describe('processHeroSpawns', () => {
  it('spawnStartTick前は何もしない', () => {
    const state = makeState({ gameTime: HERO_SPAWN_START_TICK - 1 })
    const result = processHeroSpawns(state)

    expect(result.heroes).toEqual([])
    expect(result.events).toEqual([])
    expect(result.heroSpawnConfig.heroesSpawned).toBe(0)
  })

  it('spawnStartTick到達で最初の勇者がスポーン', () => {
    const state = makeState({
      gameTime: HERO_SPAWN_START_TICK,
      heroSpawnConfig: {
        partySize: 3,
        spawnStartTick: HERO_SPAWN_START_TICK,
        spawnInterval: HERO_SPAWN_INTERVAL,
        heroesSpawned: 0,
      },
    })
    const result = processHeroSpawns(state, () => 0) // randomFn returns 0 -> 'up'

    expect(result.heroes).toHaveLength(1)
    const hero = result.heroes[0]
    expect(hero.kind).toBe('hero')
    expect(hero.id).toBe('hero-1')
    expect(hero.position).toEqual(state.entrancePosition)
    expect(hero.life).toBe(HERO_LIFE)
    expect(hero.maxLife).toBe(HERO_LIFE)
    expect(hero.attack).toBe(HERO_ATTACK)
    expect(hero.attackPattern).toBe('slash')
    expect(hero.state).toBe('exploring')
    expect(hero.targetFound).toBe(false)
    expect(hero.visitedCells).toBeInstanceOf(Set)
    expect(hero.visitedCells.size).toBe(1)
    expect(hero.visitedCells.has(`${state.entrancePosition.x},${state.entrancePosition.y}`)).toBe(true)
    expect(hero.pathHistory).toEqual([state.entrancePosition])
    expect(result.heroSpawnConfig.heroesSpawned).toBe(1)
    expect(result.nextHeroId).toBe(1)
  })

  it('spawnInterval間隔で順次スポーン', () => {
    // 2番目の勇者のスポーンタイミング
    const state = makeState({
      gameTime: HERO_SPAWN_START_TICK + HERO_SPAWN_INTERVAL,
      heroes: [],
      heroSpawnConfig: {
        partySize: 3,
        spawnStartTick: HERO_SPAWN_START_TICK,
        spawnInterval: HERO_SPAWN_INTERVAL,
        heroesSpawned: 1,
      },
      nextHeroId: 1,
    })
    const result = processHeroSpawns(state, () => 0.25) // Math.floor(0.25*4)=1 -> 'down'

    expect(result.heroes).toHaveLength(1)
    expect(result.heroes[0].id).toBe('hero-2')
    expect(result.heroes[0].direction).toBe('down')
    expect(result.heroSpawnConfig.heroesSpawned).toBe(2)
    expect(result.nextHeroId).toBe(2)
  })

  it('partySize分スポーンしたら終了', () => {
    const state = makeState({
      gameTime: HERO_SPAWN_START_TICK + 2 * HERO_SPAWN_INTERVAL,
      heroSpawnConfig: {
        partySize: 2,
        spawnStartTick: HERO_SPAWN_START_TICK,
        spawnInterval: HERO_SPAWN_INTERVAL,
        heroesSpawned: 2,
      },
    })
    const result = processHeroSpawns(state)

    expect(result.heroes).toEqual([])
    expect(result.events).toEqual([])
    expect(result.heroSpawnConfig.heroesSpawned).toBe(2)
  })

  it('HERO_PARTY_ANNOUNCEDイベントの発行タイミング', () => {
    const announceTick = HERO_SPAWN_START_TICK - HERO_ANNOUNCE_TICKS
    const state = makeState({
      gameTime: announceTick,
      heroSpawnConfig: {
        partySize: 3,
        spawnStartTick: HERO_SPAWN_START_TICK,
        spawnInterval: HERO_SPAWN_INTERVAL,
        heroesSpawned: 0,
      },
    })
    const result = processHeroSpawns(state)

    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toEqual({
      type: 'HERO_PARTY_ANNOUNCED',
      partySize: 3,
      spawnStartTick: HERO_SPAWN_START_TICK,
    })
    expect(result.heroes).toEqual([])
  })

  it('HERO_SPAWNEDイベントに勇者情報が含まれる', () => {
    const state = makeState({
      gameTime: HERO_SPAWN_START_TICK,
      heroSpawnConfig: {
        partySize: 1,
        spawnStartTick: HERO_SPAWN_START_TICK,
        spawnInterval: HERO_SPAWN_INTERVAL,
        heroesSpawned: 0,
      },
    })
    const result = processHeroSpawns(state, () => 0)

    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toEqual({
      type: 'HERO_SPAWNED',
      heroId: 'hero-1',
      position: state.entrancePosition,
    })
  })

  it('入口占有時もスポーンする', () => {
    const state = makeState({
      gameTime: HERO_SPAWN_START_TICK,
      heroSpawnConfig: {
        partySize: 2,
        spawnStartTick: HERO_SPAWN_START_TICK,
        spawnInterval: HERO_SPAWN_INTERVAL,
        heroesSpawned: 0,
      },
      monsters: [
        {
          id: 'monster-1',
          type: 'nijirigoke',
          position: { x: 10, y: 0 }, // entrance position for 20-width grid
          direction: 'down',
          pattern: 'straight',
          phase: 'mobile',
          phaseTickCounter: 0,
          life: 16,
          maxLife: 16,
          attack: 0,
          predationTargets: [],
          carryingNutrient: 0,
          nestPosition: null,
          nestOrientation: null,
        },
      ],
    })
    const result = processHeroSpawns(state, () => 0)

    expect(result.heroes).toHaveLength(1)
    expect(result.heroes[0].position).toEqual(state.entrancePosition)
  })

  it('スポーンタイミングでないtickでは何もしない', () => {
    // heroesSpawned=1, 次のスポーンはspawnStartTick + interval だが、今はその間のtick
    const state = makeState({
      gameTime: HERO_SPAWN_START_TICK + HERO_SPAWN_INTERVAL - 1,
      heroSpawnConfig: {
        partySize: 3,
        spawnStartTick: HERO_SPAWN_START_TICK,
        spawnInterval: HERO_SPAWN_INTERVAL,
        heroesSpawned: 1,
      },
      nextHeroId: 1,
    })
    const result = processHeroSpawns(state)

    expect(result.heroes).toEqual([])
    expect(result.events).toEqual([])
    expect(result.heroSpawnConfig.heroesSpawned).toBe(1)
  })

  it('randomFnでdirectionが決まる', () => {
    const directions = ['up', 'down', 'left', 'right'] as const
    const randomValues = [0, 0.25, 0.5, 0.75] // Math.floor(v*4) => 0,1,2,3
    for (let i = 0; i < 4; i++) {
      const state = makeState({
        gameTime: HERO_SPAWN_START_TICK,
        heroSpawnConfig: {
          partySize: 1,
          spawnStartTick: HERO_SPAWN_START_TICK,
          spawnInterval: HERO_SPAWN_INTERVAL,
          heroesSpawned: 0,
        },
      })
      const result = processHeroSpawns(state, () => randomValues[i])
      expect(result.heroes[0].direction).toBe(directions[i])
    }
  })
})
