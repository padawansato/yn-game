<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import {
  createGameState,
  initializeNutrients,
  tick,
  dig,
  getTotalNutrients,
  GameLoop,
  LAYING_NUTRIENT_THRESHOLD,
  LAYING_LIFE_THRESHOLD,
  PUPA_NUTRIENT_THRESHOLD,
  BUD_NUTRIENT_THRESHOLD,
  BUD_LIFE_THRESHOLD,
  MONSTER_CONFIGS,
  type GameState,
  type Cell,
  type Monster,
  type MonsterType,
} from './core'

// Initialize game
function createInitialState(): GameState {
  const state = createGameState(10, 8, 1.0)
  const totalNutrients = 200
  const { grid } = initializeNutrients(state.grid, totalNutrients)

  // テスト用: エントリーポイント近くに高養分土を配置
  grid[2][6].nutrientAmount = 20 // リザードマン用 (17以上)
  grid[3][4].nutrientAmount = 12 // ガジガジムシ用 (10-16)

  return {
    ...state,
    grid,
    totalInitialNutrients: totalNutrients,
  }
}

const gameState = ref<GameState>(createInitialState())
const events = ref<string[]>([])
const isRunning = ref(false)
const isPaused = ref(false)

// Game Loop
function executeTickWithEvents() {
  const randomFn = seededRandom || Math.random
  const result = tick(gameState.value, randomFn)
  result.events.forEach((e) => {
    events.value.unshift(`[t${gameState.value.gameTime}][${e.type}] ${formatEvent(e)}`)
  })
  gameState.value = result.state
}

let gameLoop: GameLoop | null = null

function initGameLoop() {
  gameLoop = new GameLoop(() => {
    executeTickWithEvents()
  }, 500)
}

initGameLoop()

onUnmounted(() => {
  gameLoop?.stop()
})

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
  executeTickWithEvents()
}

function startGame() {
  if (gameLoop) {
    gameLoop.start()
    isRunning.value = true
    isPaused.value = false
  }
}

function pauseGame() {
  if (gameLoop) {
    gameLoop.pause()
    isPaused.value = true
  }
}

function resumeGame() {
  if (gameLoop) {
    gameLoop.resume()
    isPaused.value = false
  }
}

function stopGame() {
  if (gameLoop) {
    gameLoop.stop()
    isRunning.value = false
    isPaused.value = false
  }
}

function handleReset() {
  stopGame()
  seededRandom = null // 通常モードに戻す
  gameState.value = createInitialState()
  events.value = []
  initGameLoop()
}

// === 固定乱数 ===
function createSeededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0x100000000
  }
}

// === デバッグシナリオ ===
interface Scenario {
  name: string
  description: string
  setup: () => void
}

const scenarios: Scenario[] = [
  {
    name: 'リザードマン産卵',
    description: '巣あり・養分/life十分 → laying → 卵 → 孵化',
    setup() {
      stopGame()
      const grid = makeEmptyArena(12, 10)
      const state = makeState(grid, [
        {
          type: 'lizardman',
          position: { x: 5, y: 4 },
          nestPosition: { x: 5, y: 4 },
          nestOrientation: 'horizontal' as const,
          life: LAYING_LIFE_THRESHOLD + 20,
          carryingNutrient: LAYING_NUTRIENT_THRESHOLD + 5,
          phase: 'normal',
        },
      ])
      loadScenario(state, 'リザードマン産卵: Startで観察')
    },
  },
  {
    name: 'ニジリゴケ変態',
    description: '養分豊富 → bud → flower → withered → 繁殖',
    setup() {
      stopGame()
      const grid = makeEmptyArena(12, 10)
      // 周囲に養分を置く（bud吸収用）
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          grid[4 + dy][5 + dx].nutrientAmount = 5
        }
      }
      const state = makeState(grid, [
        {
          type: 'nijirigoke',
          position: { x: 5, y: 4 },
          life: BUD_LIFE_THRESHOLD,
          carryingNutrient: BUD_NUTRIENT_THRESHOLD,
          phase: 'mobile',
        },
      ])
      loadScenario(state, 'ニジリゴケ変態: bud→flower→withered→繁殖')
    },
  },
  {
    name: 'ガジガジムシ変態',
    description: '養分あり → pupa → adult → 繁殖',
    setup() {
      stopGame()
      const grid = makeEmptyArena(12, 10)
      const state = makeState(grid, [
        {
          type: 'gajigajimushi',
          position: { x: 5, y: 4 },
          life: 25,
          carryingNutrient: PUPA_NUTRIENT_THRESHOLD + 3,
          phase: 'larva',
        },
      ])
      loadScenario(state, 'ガジガジムシ変態: pupa→adult→繁殖')
    },
  },
  {
    name: '捕食チェーン',
    description: 'リザードマン・ガジガジムシ・ニジリゴケが同エリアに',
    setup() {
      stopGame()
      const grid = makeEmptyArena(12, 10)
      const state = makeState(grid, [
        {
          type: 'lizardman',
          position: { x: 5, y: 4 },
          life: 60,
          carryingNutrient: 3,
          phase: 'normal',
        },
        {
          type: 'gajigajimushi',
          position: { x: 6, y: 4 },
          life: 20,
          carryingNutrient: 3,
          phase: 'larva',
        },
        {
          type: 'nijirigoke',
          position: { x: 7, y: 4 },
          life: 10,
          carryingNutrient: 3,
          phase: 'mobile',
        },
        {
          type: 'nijirigoke',
          position: { x: 4, y: 4 },
          life: 10,
          carryingNutrient: 3,
          phase: 'mobile',
        },
      ])
      loadScenario(state, '捕食チェーン: 3種が遭遇')
    },
  },
]

// シナリオ用ヘルパー
function makeEmptyArena(width: number, height: number): Cell[][] {
  const grid: Cell[][] = []
  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0, magicAmount: 0 })
      } else {
        row.push({ type: 'empty', nutrientAmount: 0, magicAmount: 0 })
      }
    }
    grid.push(row)
  }
  return grid
}

interface MonsterSetup {
  type: MonsterType
  position: { x: number; y: number }
  nestPosition?: { x: number; y: number } | null
  nestOrientation?: 'horizontal' | 'vertical' | null
  life: number
  carryingNutrient: number
  phase: Monster['phase']
}

let monsterIdCounter = 0

function makeState(grid: Cell[][], monsterSetups: MonsterSetup[]): GameState {
  monsterIdCounter = 0
  const monsters: Monster[] = monsterSetups.map((s) => {
    monsterIdCounter++
    const config = MONSTER_CONFIGS[s.type]
    return {
      id: `monster-${monsterIdCounter}`,
      type: s.type,
      position: { ...s.position },
      direction: 'right' as const,
      pattern: config.pattern,
      phase: s.phase,
      phaseTickCounter: 0,
      life: s.life,
      maxLife: config.life,
      attack: config.attack,
      predationTargets: [...config.predationTargets],
      carryingNutrient: s.carryingNutrient,
      nestPosition: s.nestPosition ? { ...s.nestPosition } : null,
      nestOrientation: s.nestOrientation ?? null,
    }
  })

  const totalNutrients = getTotalNutrients({
    grid,
    monsters,
    totalInitialNutrients: 0,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: 0,
  })

  return {
    grid,
    monsters,
    totalInitialNutrients: totalNutrients,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: monsterIdCounter,
  }
}

function loadScenario(state: GameState, message: string) {
  gameState.value = state
  events.value = [`[SCENARIO] ${message}`]
  seededRandom = createSeededRandom(42)
  initGameLoop()
}

// シナリオモードでは固定乱数を使う
let seededRandom: (() => number) | null = null

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
    default:
      return e.type
  }
}

// デバッグ: コンソールから window.__state でゲーム状態を確認可能
(window as unknown as Record<string, unknown>).__state = gameState
;(window as unknown as Record<string, unknown>).__monsters = computed(() => {
  return gameState.value.monsters.map((m) => ({
    id: m.id,
    type: m.type,
    phase: m.phase,
    pos: `${m.position.x},${m.position.y}`,
    life: `${m.life}/${m.maxLife}`,
    nutrient: m.carryingNutrient,
    nest: m.nestPosition ? `${m.nestPosition.x},${m.nestPosition.y}` : null,
    phaseTick: m.phaseTickCounter,
  }))
})

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
  return gameState.value.monsters.filter((m) => m.position.x === x && m.position.y === y)
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

// 養分レベルに応じたクラス名を返す
function getNutrientLevel(amount: number): 'low' | 'mid' | 'high' | null {
  if (amount <= 0) return null
  if (amount >= 17) return 'high' // リザードマン
  if (amount >= 10) return 'mid' // ガジガジムシ
  return 'low' // ニジリゴケ
}
</script>

<template>
  <div class="debug-ui">
    <h1>yn-game デバッグUI</h1>

    <div class="controls">
      <button
        :disabled="isRunning && !isPaused"
        @click="handleTick"
      >
        Tick
      </button>
      <button
        v-if="!isRunning"
        @click="startGame"
      >
        Start
      </button>
      <button
        v-else-if="isPaused"
        @click="resumeGame"
      >
        Resume
      </button>
      <button
        v-else
        @click="pauseGame"
      >
        Pause
      </button>
      <button
        v-if="isRunning"
        @click="stopGame"
      >
        Stop
      </button>
      <button @click="handleReset">
        Reset
      </button>
    </div>

    <div class="scenarios">
      <strong>シナリオ:</strong>
      <button
        v-for="s in scenarios"
        :key="s.name"
        class="scenario-btn"
        :title="s.description"
        @click="s.setup()"
      >
        {{ s.name }}
      </button>
    </div>

    <div class="status">
      <div class="status-row">
        <span>ゲーム時間: {{ gameState.gameTime }}</span>
        <span>養分: {{ totalNutrients }} / {{ gameState.totalInitialNutrients }}</span>
        <span :class="['dig-power', { 'dig-power-exhausted': gameState.digPower <= 0 }]">
          掘りパワー: {{ gameState.digPower }}
          <span
            v-if="gameState.digPower <= 0"
            class="dig-power-warning"
          >（掘削不可）</span>
        </span>
      </div>
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
          >{{
            getOverlapCount(x, y)
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
      <span class="legend-item"><span class="cell monster-gajigajimushi">虫</span> ガジガジムシ</span>
      <span class="legend-item"><span class="cell monster-lizardman">蜥</span> リザードマン</span>
    </div>

    <div class="legend nutrient-legend">
      <strong>養分:</strong>
      <span class="legend-item"><span class="nutrient-dot nutrient-low" /> 1-9 → 苔</span>
      <span class="legend-item"><span class="nutrient-dot nutrient-mid" /> 10-16 → 虫</span>
      <span class="legend-item"><span class="nutrient-dot nutrient-high" /> 17+ → 蜥</span>
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

.scenarios {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.scenario-btn {
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
  cursor: pointer;
  background: #2a3a2a;
  color: #8f8;
  border: 1px solid #4a6a4a;
  border-radius: 4px;
}

.scenario-btn:hover {
  background: #3a4a3a;
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

.status-row {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.dig-power {
  color: #4caf50;
  font-weight: bold;
}

.dig-power-exhausted {
  color: #ef5350;
}

.dig-power-warning {
  font-size: 0.85em;
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.nutrient-low {
  background: #4caf50; /* 緑 - ニジリゴケ */
}

.nutrient-mid {
  background: #5c6bc0; /* 青 - ガジガジムシ */
}

.nutrient-high {
  background: #ef5350; /* 赤 - リザードマン */
}

.nutrient-legend {
  margin-top: 0.5rem;
}

.nutrient-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  vertical-align: middle;
  margin-right: 4px;
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
