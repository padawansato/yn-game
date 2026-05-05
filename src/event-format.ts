import type { Monster } from './core/types'

export function formatEvent(e: { type: string; [key: string]: unknown }): string {
  switch (e.type) {
    case 'MONSTER_SPAWNED':
      return `${(e.monster as Monster).type} spawned`
    case 'MONSTER_DIED':
      return `${(e.monster as Monster).type} died (${e.cause})`
    case 'PREDATION':
      return `${(e.predator as Monster).type} ate ${(e.prey as Monster).type}`
    case 'NUTRIENT_ABSORBED':
      return `${(e.monster as Monster).type} absorbed ${e.amount}`
    case 'NUTRIENT_RELEASED':
      return `${(e.monster as Monster).type} released ${e.amount}`
    case 'PHASE_TRANSITION':
      return `${e.monsterId} ${e.oldPhase} → ${e.newPhase}`
    case 'EGG_LAID':
      return `${e.parentId} laid egg at (${(e.position as { x: number; y: number }).x},${(e.position as { x: number; y: number }).y})`
    case 'EGG_HATCHED':
      return `${e.offspringId} hatched at (${(e.position as { x: number; y: number }).x},${(e.position as { x: number; y: number }).y})`
    case 'MONSTER_REPRODUCED':
      return `${e.parentId} reproduced → ${(e.offspringIds as string[]).length} offspring`
    case 'MONSTER_ATTACKED':
      return `${e.monsterId} hit (dmg=${e.damage}, hp=${e.remainingLife})`
    case 'HERO_SPAWNED':
      return `勇者 ${e.heroId} 出現`
    case 'HERO_PARTY_ANNOUNCED':
      return `勇者パーティー ${e.partySize}人が接近中!`
    case 'HERO_COMBAT':
      return `勇者${e.heroId} vs ${e.monsterId} (勇者dmg=${e.heroDamage}, monster dmg=${e.monsterDamage})`
    case 'HERO_DIED':
      return `勇者 ${e.heroId} 撃破!`
    case 'HERO_ESCAPED':
      return `勇者 ${e.heroId} が脱出!`
    case 'DEMON_LORD_FOUND':
      return `勇者 ${e.heroId} が魔王を発見!`
    case 'GAME_OVER':
      return `GAME OVER - 勇者が魔王の情報を持ち帰った!`
    default:
      return e.type
  }
}
