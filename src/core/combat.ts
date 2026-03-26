import type { Cell, GameEvent, Monster, Position, Direction } from './types'
import type { HeroEntity } from './hero/types'
import { HERO_NUTRIENT_DROP } from './constants'
import { releaseNutrientsOnDeath, getSurroundingCells } from './nutrient'

function getFrontCell(position: Position, direction: Direction): Position {
  switch (direction) {
    case 'up':
      return { x: position.x, y: position.y - 1 }
    case 'down':
      return { x: position.x, y: position.y + 1 }
    case 'left':
      return { x: position.x - 1, y: position.y }
    case 'right':
      return { x: position.x + 1, y: position.y }
  }
}

function isInBounds(pos: Position, grid: Cell[][]): boolean {
  return pos.y >= 0 && pos.y < grid.length && pos.x >= 0 && pos.x < grid[0].length
}

function releaseHeroNutrients(position: Position, grid: Cell[][]): Cell[][] {
  const cells = getSurroundingCells(position, grid)
  if (cells.length === 0) return grid

  const perCell = Math.floor(HERO_NUTRIENT_DROP / cells.length)
  let remainder = HERO_NUTRIENT_DROP % cells.length

  return grid.map((row, y) =>
    row.map((cell, x) => {
      const match = cells.find((c) => c.x === x && c.y === y)
      if (match) {
        const extra = remainder > 0 ? 1 : 0
        if (remainder > 0) remainder--
        return { ...cell, nutrientAmount: cell.nutrientAmount + perCell + extra }
      }
      return cell
    })
  )
}

export function processCombat(
  heroes: HeroEntity[],
  monsters: Monster[],
  grid: Cell[][]
): {
  heroes: HeroEntity[]
  monsters: Monster[]
  grid: Cell[][]
  events: GameEvent[]
} {
  const events: GameEvent[] = []

  // Phase 1: Calculate all damage simultaneously
  const heroDamage = new Map<string, number>() // heroId -> total damage
  const monsterDamage = new Map<string, number>() // monsterId -> total damage
  const combatPairs: { heroId: string; monsterId: string; heroDmg: number; monsterDmg: number }[] = []

  // Heroes attacking monsters
  for (const hero of heroes) {
    if (hero.state === 'dead' || hero.attack <= 0) continue
    const front = getFrontCell(hero.position, hero.direction)
    if (!isInBounds(front, grid)) continue

    for (const monster of monsters) {
      if (monster.position.x === front.x && monster.position.y === front.y) {
        monsterDamage.set(monster.id, (monsterDamage.get(monster.id) ?? 0) + hero.attack)
        // Track this pair for event generation
        const existing = combatPairs.find((p) => p.heroId === hero.id && p.monsterId === monster.id)
        if (existing) {
          existing.monsterDmg += hero.attack
        } else {
          combatPairs.push({ heroId: hero.id, monsterId: monster.id, heroDmg: 0, monsterDmg: hero.attack })
        }
      }
    }
  }

  // Monsters attacking heroes
  for (const monster of monsters) {
    if (monster.attack <= 0) continue
    const front = getFrontCell(monster.position, monster.direction)
    if (!isInBounds(front, grid)) continue

    for (const hero of heroes) {
      if (hero.state === 'dead') continue
      if (hero.position.x === front.x && hero.position.y === front.y) {
        heroDamage.set(hero.id, (heroDamage.get(hero.id) ?? 0) + monster.attack)
        const existing = combatPairs.find((p) => p.heroId === hero.id && p.monsterId === monster.id)
        if (existing) {
          existing.heroDmg += monster.attack
        } else {
          combatPairs.push({ heroId: hero.id, monsterId: monster.id, heroDmg: monster.attack, monsterDmg: 0 })
        }
      }
    }
  }

  // If no combat occurred, return early
  if (combatPairs.length === 0) {
    return { heroes, monsters, grid, events }
  }

  // Emit HERO_COMBAT events
  for (const pair of combatPairs) {
    events.push({
      type: 'HERO_COMBAT',
      heroId: pair.heroId,
      monsterId: pair.monsterId,
      heroDamage: pair.heroDmg,
      monsterDamage: pair.monsterDmg,
    })
  }

  // Phase 2: Apply damage
  let updatedHeroes = heroes.map((hero) => {
    const dmg = heroDamage.get(hero.id)
    if (dmg) {
      const newLife = hero.life - dmg
      return { ...hero, life: newLife, state: newLife <= 0 ? ('dead' as const) : hero.state }
    }
    return hero
  })

  let updatedMonsters = monsters.map((monster) => {
    const dmg = monsterDamage.get(monster.id)
    if (dmg) {
      return { ...monster, life: monster.life - dmg }
    }
    return monster
  })

  // Phase 3: Process deaths
  let updatedGrid = grid

  // Monster deaths
  const deadMonsters = updatedMonsters.filter((m) => m.life <= 0)
  for (const dead of deadMonsters) {
    events.push({ type: 'MONSTER_DIED', monster: dead, cause: 'combat' })
    updatedGrid = releaseNutrientsOnDeath(dead, updatedGrid)
  }
  updatedMonsters = updatedMonsters.filter((m) => m.life > 0)

  // Hero deaths
  for (const hero of updatedHeroes) {
    if (hero.life <= 0 && hero.state === 'dead') {
      events.push({ type: 'HERO_DIED', heroId: hero.id, position: hero.position })
      updatedGrid = releaseHeroNutrients(hero.position, updatedGrid)
    }
  }

  return {
    heroes: updatedHeroes,
    monsters: updatedMonsters,
    grid: updatedGrid,
    events,
  }
}
