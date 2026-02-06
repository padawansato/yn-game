import type { Monster } from '../types'
import { HUNGER_THRESHOLD_RATIO } from '../constants'

/**
 * Check if monster is hungry
 */
export function isHungry(monster: Monster): boolean {
  return monster.life < monster.maxLife * HUNGER_THRESHOLD_RATIO
}
