import { describe, it, expect } from 'vitest'
import { formatEvent } from './event-format'

function makeMonster(type: string) {
  return { id: 'm-1', type, phase: 'mobile', position: { x: 0, y: 0 } }
}

describe('formatEvent', () => {
  it('formats MONSTER_SPAWNED', () => {
    expect(formatEvent({ type: 'MONSTER_SPAWNED', monster: makeMonster('nijirigoke') }))
      .toBe('nijirigoke spawned')
  })

  it('formats MONSTER_DIED with cause', () => {
    expect(formatEvent({ type: 'MONSTER_DIED', monster: makeMonster('gajigajimushi'), cause: 'starvation' }))
      .toBe('gajigajimushi died (starvation)')
  })

  it('formats PREDATION as predator ate prey', () => {
    expect(formatEvent({
      type: 'PREDATION',
      predator: makeMonster('lizardman'),
      prey: makeMonster('nijirigoke'),
    })).toBe('lizardman ate nijirigoke')
  })

  it('formats NUTRIENT_ABSORBED with amount', () => {
    expect(formatEvent({ type: 'NUTRIENT_ABSORBED', monster: makeMonster('nijirigoke'), amount: 5 }))
      .toBe('nijirigoke absorbed 5')
  })

  it('formats NUTRIENT_RELEASED with amount', () => {
    expect(formatEvent({ type: 'NUTRIENT_RELEASED', monster: makeMonster('nijirigoke'), amount: 3 }))
      .toBe('nijirigoke released 3')
  })

  it('formats PHASE_TRANSITION with arrow', () => {
    expect(formatEvent({
      type: 'PHASE_TRANSITION',
      monsterId: 'monster-7',
      oldPhase: 'mobile',
      newPhase: 'bud',
    })).toBe('monster-7 mobile → bud')
  })

  it('formats EGG_LAID with parent and position', () => {
    expect(formatEvent({
      type: 'EGG_LAID',
      parentId: 'monster-2',
      eggId: 'monster-3',
      position: { x: 4, y: 5 },
    })).toBe('monster-2 laid egg at (4,5)')
  })

  it('formats EGG_HATCHED with offspring and position', () => {
    expect(formatEvent({
      type: 'EGG_HATCHED',
      offspringId: 'monster-9',
      position: { x: 1, y: 2 },
    })).toBe('monster-9 hatched at (1,2)')
  })

  it('formats MONSTER_REPRODUCED with offspring count', () => {
    expect(formatEvent({
      type: 'MONSTER_REPRODUCED',
      parentId: 'monster-4',
      offspringIds: ['o-1', 'o-2', 'o-3'],
      positions: [],
    })).toBe('monster-4 reproduced → 3 offspring')
  })

  it('formats MONSTER_ATTACKED with damage and remaining life', () => {
    expect(formatEvent({
      type: 'MONSTER_ATTACKED',
      monsterId: 'monster-8',
      damage: 5,
      remainingLife: 22,
    })).toBe('monster-8 hit (dmg=5, hp=22)')
  })

  it('formats HERO_SPAWNED', () => {
    expect(formatEvent({ type: 'HERO_SPAWNED', heroId: 'hero-1', position: { x: 0, y: 0 } }))
      .toBe('勇者 hero-1 出現')
  })

  it('formats HERO_PARTY_ANNOUNCED with party size', () => {
    expect(formatEvent({ type: 'HERO_PARTY_ANNOUNCED', partySize: 3, spawnStartTick: 100 }))
      .toBe('勇者パーティー 3人が接近中!')
  })

  it('formats HERO_COMBAT with both damage values', () => {
    expect(formatEvent({
      type: 'HERO_COMBAT',
      heroId: 'hero-2',
      monsterId: 'monster-5',
      heroDamage: 5,
      monsterDamage: 3,
    })).toBe('勇者hero-2 vs monster-5 (勇者dmg=5, monster dmg=3)')
  })

  it('formats HERO_DIED', () => {
    expect(formatEvent({ type: 'HERO_DIED', heroId: 'hero-1', position: { x: 0, y: 0 } }))
      .toBe('勇者 hero-1 撃破!')
  })

  it('formats HERO_ESCAPED', () => {
    expect(formatEvent({ type: 'HERO_ESCAPED', heroId: 'hero-2' }))
      .toBe('勇者 hero-2 が脱出!')
  })

  it('formats DEMON_LORD_FOUND', () => {
    expect(formatEvent({ type: 'DEMON_LORD_FOUND', heroId: 'hero-3' }))
      .toBe('勇者 hero-3 が魔王を発見!')
  })

  it('formats GAME_OVER', () => {
    expect(formatEvent({ type: 'GAME_OVER', reason: 'demon_lord_found' }))
      .toBe('GAME OVER - 勇者が魔王の情報を持ち帰った!')
  })

  it('returns event type for unknown event', () => {
    expect(formatEvent({ type: 'UNKNOWN_EVENT' })).toBe('UNKNOWN_EVENT')
  })
})
