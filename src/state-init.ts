import { createGameState, initializeNutrients } from './core'
import { createDefaultConfig, type GameConfig } from './core/config'
import { GRID_PRESETS, type GridPresetKey } from './core/constants'
import type { GameState } from './core/types'

/**
 * Build a GameConfig whose grid dimensions come from the named preset.
 * All other config fields are inherited from createDefaultConfig().
 */
export function createConfigForPreset(key: GridPresetKey): GameConfig {
  const base = createDefaultConfig()
  return {
    ...base,
    grid: {
      ...base.grid,
      defaultWidth: GRID_PRESETS[key].width,
      defaultHeight: GRID_PRESETS[key].height,
    },
  }
}

/**
 * Build the default startup GameState for the given config.
 * Initializes random nutrients then seeds two high-nutrient soil cells
 * near the entrance so monsters can spawn quickly.
 */
export function createInitialState(config: GameConfig): GameState {
  const state = createGameState(config.grid.defaultWidth, config.grid.defaultHeight, 1.0, {}, config)
  const totalNutrients = 200
  const { grid } = initializeNutrients(state.grid, totalNutrients, state.config)

  // テスト用: エントリーポイント近くに高養分土を配置
  if (grid.length > 3 && grid[2].length > 6) {
    grid[2][6].nutrientAmount = 20 // リザードマン用 (17以上)
  }
  if (grid.length > 3 && grid[3].length > 4) {
    grid[3][4].nutrientAmount = 12 // ガジガジムシ用 (10-16)
  }

  return {
    ...state,
    grid,
    totalInitialNutrients: totalNutrients,
  }
}
