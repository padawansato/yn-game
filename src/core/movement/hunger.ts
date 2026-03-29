import type { Monster } from '../types'
import type { GameConfig } from '../config'

/**
 * Check if monster is hungry
 */
export function isHungry(monster: Monster, config: GameConfig): boolean {
  return monster.life < monster.maxLife * config.nutrient.hungerThresholdRatio
}
