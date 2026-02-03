<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  initializeNutrients,
  tick,
  dig,
  getTotalNutrients,
  type GameState,
  type Cell,
  type Monster,
  type MonsterType,
} from './core'

// Initialize game
function createInitialState(): GameState {
  const width = 10
  const height = 8

  // Calculate entry point position (top center, one row below the wall)
  const entryX = Math.floor(width / 2)
  const entryY = 1

  // Create grid with walls on borders
  const grid: Cell[][] = []
  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0 })
      } else if (x === entryX && y === entryY) {
        // Entry point - initial empty cell for digging
        row.push({ type: 'empty', nutrientAmount: 0 })
      } else {
        row.push({ type: 'soil', nutrientAmount: 0 })
      }
    }
    grid.push(row)
  }

  // Initialize nutrients
  const { grid: initializedGrid } = initializeNutrients(grid, 200)

  return {
    grid: initializedGrid,
    monsters: [],
    totalInitialNutrients: 200,
  }
}

const gameState = ref<GameState>(createInitialState())
const events = ref<string[]>([])
const autoRunning = ref(false)
let autoInterval: number | null = null

// Actions
function handleCellClick(x: number, y: number) {
  const result = dig(gameState.value, { x, y })
  if ('error' in result) {
    events.value.unshift(`[Error] ${result.error}`)
  } else {
    gameState.value = result.state
    result.events.forEach((e) => {
      events.value.unshift(`[${e.type}] ${formatEvent(e)}`)
    })
  }
}

function handleTick() {
  const result = tick(gameState.value)
  gameState.value = result.state
  result.events.forEach((e) => {
    events.value.unshift(`[${e.type}] ${formatEvent(e)}`)
  })
}

function toggleAuto() {
  if (autoRunning.value) {
    if (autoInterval) clearInterval(autoInterval)
    autoInterval = null
    autoRunning.value = false
  } else {
    autoRunning.value = true
    autoInterval = setInterval(handleTick, 500)
  }
}

function handleReset() {
  if (autoInterval) clearInterval(autoInterval)
  autoInterval = null
  autoRunning.value = false
  gameState.value = createInitialState()
  events.value = []
}

function formatEvent(e: { type: string; [key: string]: unknown }): string {
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
    default:
      return e.type
  }
}

// Display helpers
type EntityType = MonsterType

const ENTITY_ICONS: Record<EntityType, string> = {
  lizardman: '蜥',
  gajigajimushi: '虫',
  nijirigoke: '苔',
}

function getCellDisplay(cell: Cell, x: number, y: number): string {
  const monsters = getMonstersAtCell(x, y)
  const topMonster = getTopMonster(monsters)

  if (topMonster) {
    return ENTITY_ICONS[topMonster.type]
  }

  switch (cell.type) {
    case 'wall':
      return '壁'
    case 'soil':
      return '土'
    case 'empty':
      return '　'
  }
}

function getCellClass(cell: Cell, x: number, y: number): string {
  const monsters = getMonstersAtCell(x, y)
  const topMonster = getTopMonster(monsters)

  if (topMonster) {
    return `cell monster-${topMonster.type}`
  }

  return `cell cell-${cell.type}`
}

function getOverlapCount(x: number, y: number): number {
  return getMonstersAtCell(x, y).length
}

const totalNutrients = computed(() => getTotalNutrients(gameState.value))

const monsterSummary = computed(() => {
  const monsters = gameState.value.monsters
  const summary: Record<string, { count: number; totalLife: number; totalCarrying: number }> = {}
  for (const m of monsters) {
    if (!summary[m.type]) {
      summary[m.type] = { count: 0, totalLife: 0, totalCarrying: 0 }
    }
    summary[m.type].count++
    summary[m.type].totalLife += m.life
    summary[m.type].totalCarrying += m.carryingNutrient
  }
  return summary
})

// Monster helpers
function getMonstersAtCell(x: number, y: number): Monster[] {
  return gameState.value.monsters.filter(
    (m) => m.position.x === x && m.position.y === y
  )
}

// Display priority: lower number = higher priority
const DISPLAY_PRIORITY: Record<EntityType, number> = {
  lizardman: 0,
  gajigajimushi: 1,
  nijirigoke: 2,
}

function getTopMonster(monsters: Monster[]): Monster | null {
  if (monsters.length === 0) return null
  return monsters.reduce((top, curr) =>
    DISPLAY_PRIORITY[curr.type] < DISPLAY_PRIORITY[top.type] ? curr : top
  )
}
</script>

<template>
  <div class="debug-ui">
    <h1>yn-game デバッグUI</h1>

    <div class="controls">
      <button
        :disabled="autoRunning"
        @click="handleTick"
      >
        Tick
      </button>
      <button @click="toggleAuto">
        {{ autoRunning ? 'Stop' : 'Auto' }}
      </button>
      <button @click="handleReset">
        Reset
      </button>
    </div>

    <div class="status">
      <div>養分: {{ totalNutrients }} / {{ gameState.totalInitialNutrients }}</div>
      <div
        v-for="(info, type) in monsterSummary"
        :key="type"
      >
        {{ type }}: {{ info.count }}匹 (計{{ info.totalLife }}life, 養分{{ info.totalCarrying }})
      </div>
    </div>

    <div class="grid">
      <div
        v-for="(row, y) in gameState.grid"
        :key="y"
        class="row"
      >
        <div
          v-for="(cell, x) in row"
          :key="x"
          :class="getCellClass(cell, x, y)"
          :title="`(${x},${y}) 養分:${cell.nutrientAmount}`"
          @click="handleCellClick(x, y)"
        >
          <span class="cell-content">{{ getCellDisplay(cell, x, y) }}</span>
          <span
            v-if="getOverlapCount(x, y) > 1"
            class="overlap-badge"
          >{{ getOverlapCount(x, y) }}</span>
          <span
            v-if="cell.type === 'soil' && cell.nutrientAmount > 0"
            class="nutrient-indicator"
            :style="{ opacity: Math.min(1, cell.nutrientAmount / 50) }"
          />
        </div>
      </div>
    </div>

    <div class="legend">
      <span class="legend-item"><span class="cell cell-wall">壁</span> 壁</span>
      <span class="legend-item"><span class="cell cell-soil">土</span> 土(クリックでdig)</span>
      <span class="legend-item"><span class="cell cell-empty" /> 空</span>
      <span class="legend-item"><span class="cell monster-nijirigoke">苔</span> ニジリゴケ</span>
      <span class="legend-item"><span class="cell monster-gajigajimushi">虫</span> ガジガジムシ</span>
      <span class="legend-item"><span class="cell monster-lizardman">蜥</span> リザードマン</span>
    </div>

    <div class="events">
      <h3>イベントログ</h3>
      <div class="event-list">
        <div
          v-for="(event, i) in events.slice(0, 20)"
          :key="i"
          class="event"
        >
          {{ event }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 20px;
  background: #1a1a1a;
  color: #eee;
  font-family: 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', sans-serif;
}

.debug-ui {
  max-width: 800px;
  margin: 0 auto;
}

h1 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.controls {
  margin-bottom: 1rem;
}

.controls button {
  padding: 0.5rem 1rem;
  margin-right: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  background: #333;
  color: #eee;
  border: 1px solid #555;
  border-radius: 4px;
}

.controls button:hover {
  background: #444;
}

.controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status {
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #222;
  border-radius: 4px;
}

.grid {
  display: inline-block;
  border: 2px solid #555;
  background: #222;
  margin-bottom: 1rem;
}

.row {
  display: flex;
}

.cell {
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  border: 1px solid #333;
  cursor: pointer;
  user-select: none;
  position: relative;
}

.cell-content {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.overlap-badge {
  position: absolute;
  top: 0;
  right: 0;
  min-width: 0.9rem;
  height: 0.9rem;
  background: #ff5722;
  color: #fff;
  font-size: 0.6rem;
  font-weight: bold;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: translate(25%, -25%);
}

.nutrient-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 6px;
  height: 6px;
  background: #ffd54f;
  border-radius: 50%;
}

.cell-wall {
  background: #444;
  color: #888;
  cursor: default;
}

.cell-soil {
  background: #3d2817;
  color: #8b6914;
}

.cell-soil:hover {
  background: #4d3827;
}

.cell-empty {
  background: #1a1a1a;
  cursor: default;
}

.monster-nijirigoke {
  background: #1a4d1a;
  color: #4caf50;
}

.monster-gajigajimushi {
  background: #1a1a4d;
  color: #5c6bc0;
}

.monster-lizardman {
  background: #4d1a1a;
  color: #ef5350;
}

.legend {
  margin-bottom: 1rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.9rem;
}

.legend-item .cell {
  width: 1.5rem;
  height: 1.5rem;
  font-size: 0.9rem;
  cursor: default;
}

.events {
  background: #222;
  padding: 1rem;
  border-radius: 4px;
}

.events h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.event-list {
  font-family: monospace;
  font-size: 0.85rem;
  max-height: 200px;
  overflow-y: auto;
}

.event {
  padding: 0.25rem 0;
  border-bottom: 1px solid #333;
}
</style>
