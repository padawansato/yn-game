import type { GameState } from '../core/types'
import type { GameConfig } from '../core/config'
import { makeEmptyArena, makeScenarioState } from '../core/state-builders'

export interface Scenario {
  name: string
  description: string
  message: string
  /** Build the GameState for this scenario, given the active config. */
  build(baseConfig: GameConfig): GameState
}

const SCENARIO_GRID_WIDTH = 12
const SCENARIO_GRID_HEIGHT = 10

function withScenarioGrid(base: GameConfig): GameConfig {
  return {
    ...base,
    grid: { ...base.grid, defaultWidth: SCENARIO_GRID_WIDTH, defaultHeight: SCENARIO_GRID_HEIGHT },
  }
}

export const SCENARIOS: Scenario[] = [
  {
    name: 'リザードマン産卵',
    description: '巣あり・養分/life十分 → laying → 卵 → 孵化',
    message: 'リザードマン産卵: Startで観察',
    build(baseConfig) {
      const config = withScenarioGrid(baseConfig)
      const grid = makeEmptyArena(SCENARIO_GRID_WIDTH, SCENARIO_GRID_HEIGHT)
      return makeScenarioState(
        grid,
        [
          {
            type: 'lizardman',
            position: { x: 5, y: 4 },
            nestPosition: { x: 5, y: 4 },
            nestOrientation: 'horizontal',
            life: config.monsters.lizardman.layingLifeThreshold! + 20,
            carryingNutrient: config.monsters.lizardman.layingNutrientThreshold! + 5,
            phase: 'normal',
          },
        ],
        config,
      )
    },
  },
  {
    name: 'ニジリゴケ変態',
    description: '養分豊富 → bud → flower → withered → 繁殖',
    message: 'ニジリゴケ変態: bud→flower→withered→繁殖',
    build(baseConfig) {
      const config = withScenarioGrid(baseConfig)
      const grid = makeEmptyArena(SCENARIO_GRID_WIDTH, SCENARIO_GRID_HEIGHT)
      // 周囲に養分付き土セルを配置（mobile は土からのみ吸収可能）
      grid[3][5] = { type: 'soil', nutrientAmount: 3, magicAmount: 0 }
      grid[5][5] = { type: 'soil', nutrientAmount: 3, magicAmount: 0 }
      grid[4][4] = { type: 'soil', nutrientAmount: 3, magicAmount: 0 }
      grid[4][6] = { type: 'soil', nutrientAmount: 3, magicAmount: 0 }
      return makeScenarioState(
        grid,
        [
          {
            type: 'nijirigoke',
            position: { x: 5, y: 4 },
            life: config.monsters.nijirigoke.life,
            carryingNutrient: 0,
            phase: 'mobile',
          },
        ],
        config,
      )
    },
  },
  {
    name: 'ガジガジムシ変態',
    description: '養分あり → pupa → adult → 繁殖',
    message: 'ガジガジムシ変態: pupa→adult→繁殖',
    build(baseConfig) {
      const config = withScenarioGrid(baseConfig)
      const grid = makeEmptyArena(SCENARIO_GRID_WIDTH, SCENARIO_GRID_HEIGHT)
      return makeScenarioState(
        grid,
        [
          {
            type: 'gajigajimushi',
            position: { x: 5, y: 4 },
            life: 25,
            carryingNutrient: config.monsters.gajigajimushi.pupaNutrientThreshold! + 3,
            phase: 'larva',
          },
        ],
        config,
      )
    },
  },
  {
    name: '捕食チェーン',
    description: 'リザードマン・ガジガジムシ・ニジリゴケが同エリアに',
    message: '捕食チェーン: 3種が遭遇',
    build(baseConfig) {
      const config = withScenarioGrid(baseConfig)
      const grid = makeEmptyArena(SCENARIO_GRID_WIDTH, SCENARIO_GRID_HEIGHT)
      return makeScenarioState(
        grid,
        [
          { type: 'lizardman', position: { x: 5, y: 4 }, life: 60, carryingNutrient: 3, phase: 'normal' },
          { type: 'gajigajimushi', position: { x: 6, y: 4 }, life: 20, carryingNutrient: 3, phase: 'larva' },
          { type: 'nijirigoke', position: { x: 7, y: 4 }, life: 10, carryingNutrient: 3, phase: 'mobile' },
          { type: 'nijirigoke', position: { x: 4, y: 4 }, life: 10, carryingNutrient: 3, phase: 'mobile' },
        ],
        config,
      )
    },
  },
]
