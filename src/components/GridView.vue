<script setup lang="ts">
import { computed } from 'vue'
import type { GameState } from '../core/types'
import type { GameConfig } from '../core/config'
import {
  getCellClass,
  getCellDisplay,
  getOverlapCount,
  getNutrientLevel,
  computeNestCellSet,
} from './grid-view-helpers'

interface CellClickPayload {
  x: number
  y: number
}

const props = defineProps<{
  gameState: GameState
  config: GameConfig
}>()

const emit = defineEmits<{
  'cell-click': [payload: CellClickPayload]
}>()

const nestCellSet = computed(() => computeNestCellSet(props.gameState))

function handleCellClick(x: number, y: number) {
  emit('cell-click', { x, y })
}
</script>

<template>
  <div class="grid">
    <div
      v-for="(row, y) in gameState.grid"
      :key="y"
      class="row"
    >
      <div
        v-for="(cell, x) in row"
        :key="x"
        :class="getCellClass(cell, gameState, nestCellSet, x, y)"
        :title="`(${x},${y}) 養分:${cell.nutrientAmount}`"
        @click="handleCellClick(x, y)"
      >
        <span class="cell-content">{{ getCellDisplay(cell, gameState, x, y) }}</span>
        <span
          v-if="getOverlapCount(gameState, x, y) > 1"
          class="overlap-badge"
        >{{
          getOverlapCount(gameState, x, y)
        }}</span>
        <span
          v-if="cell.type === 'soil' && getNutrientLevel(cell.nutrientAmount)"
          :class="['nutrient-indicator', `nutrient-${getNutrientLevel(cell.nutrientAmount)}`]"
        />
      </div>
    </div>
  </div>

  <div class="legend">
    <span class="legend-item"><span class="cell cell-wall">壁</span> 壁</span>
    <span class="legend-item"><span class="cell cell-soil">土</span> 土(クリックでdig)</span>
    <span class="legend-item"><span class="cell cell-empty" /> 空</span>
    <span class="legend-item"><span class="cell monster-nijirigoke">苔</span> ニジリゴケ</span>
    <span class="legend-item"><span class="cell nijirigoke-bud">蕾</span> 蕾</span>
    <span class="legend-item"><span class="cell nijirigoke-flower">花</span> 花</span>
    <span class="legend-item"><span class="cell nijirigoke-withered">枯</span> 枯</span>
    <span class="legend-item"><span class="cell monster-gajigajimushi">虫</span> ガジガジムシ</span>
    <span class="legend-item"><span class="cell monster-lizardman">蜥</span> リザードマン</span>
    <span class="legend-item"><span class="cell cell-empty nest-cell" /> 巣</span>
    <span class="legend-item"><span class="cell hero-cell">勇</span> 勇者</span>
    <span class="legend-item"><span class="cell hero-cell hero-returning">帰</span> 勇者(帰還中)</span>
    <span class="legend-item"><span class="cell entrance-cell">門</span> 入口</span>
    <span class="legend-item"><span class="cell demon-lord-cell">魔</span> 魔王</span>
  </div>

  <div class="legend nutrient-legend">
    <strong>養分:</strong>
    <span class="legend-item"><span class="nutrient-dot nutrient-low" /> 1-9 → 苔</span>
    <span class="legend-item"><span class="nutrient-dot nutrient-mid" /> 10-16 → 虫</span>
    <span class="legend-item"><span class="nutrient-dot nutrient-high" /> 17+ → 蜥</span>
  </div>
</template>
