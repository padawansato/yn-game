import type { Monster } from './core/types'

export interface MonsterSummaryEntry {
  count: number
  totalLife: number
  totalCarrying: number
}

export function computeMonsterSummary(monsters: Monster[]): Record<string, MonsterSummaryEntry> {
  const summary: Record<string, MonsterSummaryEntry> = {}
  for (const m of monsters) {
    if (!summary[m.type]) {
      summary[m.type] = { count: 0, totalLife: 0, totalCarrying: 0 }
    }
    summary[m.type].count++
    summary[m.type].totalLife += m.life
    summary[m.type].totalCarrying += m.carryingNutrient
  }
  return summary
}
