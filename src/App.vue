<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import {
  createGameState,
  initializeNutrients,
  tick,
  dig,
  getTotalNutrients,
  GameLoop,
  createSeededRandom,
  type GameState,
  type Cell,
  type Monster,
  type MonsterType,
} from './core'
import { createDefaultConfig, type GameConfig } from './core/config'
import { GRID_PRESETS, type GridPresetKey } from './core/constants'
import GridView from './components/GridView.vue'

function createConfigForPreset(key: GridPresetKey): GameConfig {
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

const activePresetKey = ref<GridPresetKey>('small')
const gameConfig = ref<GameConfig>(createConfigForPreset(activePresetKey.value))

// Initialize game
function createInitialState(): GameState {
  const state = createGameState(
    gameConfig.value.grid.defaultWidth,
    gameConfig.value.grid.defaultHeight,
    1.0,
  )
  const totalNutrients = 200
  const { grid } = initializeNutrients(state.grid, totalNutrients, state.config)

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
const isPlacingDemonLord = ref(false)
const heroesTriggered = ref(false) // 勇者が呼ばれた（タイマー or 手動）

// Game Loop
function triggerHeroPhase() {
  heroesTriggered.value = true
  isPlacingDemonLord.value = true
  pauseGame()
  events.value.unshift(`[HERO_PHASE] 勇者が来る! 魔王を配置してください!`)
}

function executeTickWithEvents() {
  // 制限時間到達 → 魔王配置フェーズへ
  if (!heroesTriggered.value && gameState.value.gameTime >= gameConfig.value.hero.spawnStartTick) {
    triggerHeroPhase()
    return
  }

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
function handleCellClick(payload: { x: number; y: number }) {
  const { x, y } = payload
  // Demon lord placement mode
  if (isPlacingDemonLord.value) {
    const cell = gameState.value.grid[y][x]
    if (cell.type !== 'empty') {
      events.value.unshift(`[Error] 魔王は空きセルにのみ配置できます`)
      return
    }
    const currentTime = gameState.value.gameTime
    gameState.value = {
      ...gameState.value,
      demonLordPosition: { x, y },
      heroSpawnConfig: {
        ...gameState.value.heroSpawnConfig,
        spawnStartTick: currentTime, // 即スポーン
      },
    }
    isPlacingDemonLord.value = false
    events.value.unshift(`[DEMON_LORD_PLACED] 魔王を (${x},${y}) に配置 — 勇者が来る!`)
    // 自動再開
    if (isRunning.value) {
      resumeGame()
    }
    return
  }

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
  heroesTriggered.value = false
  isPlacingDemonLord.value = false
  initGameLoop()
}

function selectPreset(key: GridPresetKey) {
  if (activePresetKey.value === key && !isRunning.value) {
    // same preset, not running: still perform a reset so users get feedback
    handleReset()
    return
  }
  stopGame()
  activePresetKey.value = key
  gameConfig.value = createConfigForPreset(key)
  seededRandom = null
  gameState.value = createInitialState()
  events.value = []
  heroesTriggered.value = false
  isPlacingDemonLord.value = false
  initGameLoop()
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
      const scenarioConfig = {
        ...gameConfig.value,
        grid: { ...gameConfig.value.grid, defaultWidth: 12, defaultHeight: 10 },
      }
      const grid = makeEmptyArena(scenarioConfig.grid.defaultWidth, scenarioConfig.grid.defaultHeight)
      const state = makeState(grid, [
        {
          type: 'lizardman',
          position: { x: 5, y: 4 },
          nestPosition: { x: 5, y: 4 },
          nestOrientation: 'horizontal' as const,
          life: gameConfig.value.monsters.lizardman.layingLifeThreshold! + 20,
          carryingNutrient: gameConfig.value.monsters.lizardman.layingNutrientThreshold! + 5,
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
      const scenarioConfig = {
        ...gameConfig.value,
        grid: { ...gameConfig.value.grid, defaultWidth: 12, defaultHeight: 10 },
      }
      const grid = makeEmptyArena(scenarioConfig.grid.defaultWidth, scenarioConfig.grid.defaultHeight)
      // 周囲に養分付き土セルを配置（mobileは土からのみ吸収可能）
      grid[3][5] = { type: 'soil', nutrientAmount: 3, magicAmount: 0 }
      grid[5][5] = { type: 'soil', nutrientAmount: 3, magicAmount: 0 }
      grid[4][4] = { type: 'soil', nutrientAmount: 3, magicAmount: 0 }
      grid[4][6] = { type: 'soil', nutrientAmount: 3, magicAmount: 0 }
      const state = makeState(grid, [
        {
          type: 'nijirigoke',
          position: { x: 5, y: 4 },
          life: gameConfig.value.monsters.nijirigoke.life,
          carryingNutrient: 0,
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
      const scenarioConfig = {
        ...gameConfig.value,
        grid: { ...gameConfig.value.grid, defaultWidth: 12, defaultHeight: 10 },
      }
      const grid = makeEmptyArena(scenarioConfig.grid.defaultWidth, scenarioConfig.grid.defaultHeight)
      const state = makeState(grid, [
        {
          type: 'gajigajimushi',
          position: { x: 5, y: 4 },
          life: 25,
          carryingNutrient: gameConfig.value.monsters.gajigajimushi.pupaNutrientThreshold! + 3,
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
      const scenarioConfig = {
        ...gameConfig.value,
        grid: { ...gameConfig.value.grid, defaultWidth: 12, defaultHeight: 10 },
      }
      const grid = makeEmptyArena(scenarioConfig.grid.defaultWidth, scenarioConfig.grid.defaultHeight)
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
    const mConfig = gameConfig.value.monsters[s.type]
    return {
      id: `monster-${monsterIdCounter}`,
      type: s.type,
      position: { ...s.position },
      direction: 'right' as const,
      pattern: mConfig.pattern,
      phase: s.phase,
      phaseTickCounter: 0,
      life: s.life,
      maxLife: mConfig.life,
      attack: mConfig.attack,
      predationTargets: [...mConfig.predationTargets],
      carryingNutrient: s.carryingNutrient,
      nestPosition: s.nestPosition ? { ...s.nestPosition } : null,
      nestOrientation: s.nestOrientation ?? null,
    }
  })

  const heroDefaults = {
    heroes: [] as import('./core/hero/types').HeroEntity[],
    entrancePosition: { x: Math.floor(grid[0].length / 2), y: 0 },
    demonLordPosition: null,
    heroSpawnConfig: { partySize: 1, spawnStartTick: 100, spawnInterval: 10, heroesSpawned: 0 },
    nextHeroId: 0,
    isGameOver: false,
  }

  const totalNutrients = getTotalNutrients({
    grid,
    monsters,
    totalInitialNutrients: 0,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: 0,
    ...heroDefaults,
    config: gameConfig.value,
  })

  return {
    grid,
    monsters,
    totalInitialNutrients: totalNutrients,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: monsterIdCounter,
    ...heroDefaults,
    config: gameConfig.value,
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
      <button
        v-if="!heroesTriggered"
        class="summon-hero-btn"
        @click="triggerHeroPhase()"
      >
        勇者を呼ぶ
      </button>
    </div>

    <div
      v-if="isPlacingDemonLord"
      class="placement-banner"
    >
      魔王を配置してください — 空きセルをクリック
    </div>

    <div class="presets">
      <strong>サイズ:</strong>
      <button
        v-for="(preset, key) in GRID_PRESETS"
        :key="key"
        class="preset-btn"
        :class="{ active: activePresetKey === key }"
        @click="selectPreset(key as GridPresetKey)"
      >
        {{ key === 'small' ? '小' : '大' }} {{ preset.width }}×{{ preset.height }}
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

    <div
      v-if="gameState.isGameOver"
      class="game-over-banner"
    >
      GAME OVER
    </div>

    <div class="status">
      <div class="status-row">
        <span>ゲーム時間: {{ gameState.gameTime }}</span>
        <span
          v-if="!heroesTriggered"
          :class="['hero-timer', { 'hero-timer-urgent': gameConfig.hero.spawnStartTick - gameState.gameTime <= 20 }]"
        >
          勇者到来まで: {{ gameConfig.hero.spawnStartTick - gameState.gameTime }}tick
        </span>
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
      <div
        v-if="gameState.heroes.length > 0"
        class="hero-status"
      >
        勇者: {{ gameState.heroes.filter(h => h.state !== 'dead').length }}体生存
        <span
          v-for="h in gameState.heroes.filter(h => h.state !== 'dead')"
          :key="h.id"
          class="hero-badge"
        >
          {{ h.id }} (HP:{{ h.life }}/{{ h.maxLife }} {{ h.state === 'returning' ? '帰還中!' : '探索中' }})
        </span>
      </div>
    </div>

    <GridView
      :game-state="gameState"
      :config="gameConfig"
      @cell-click="handleCellClick"
    />

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

.presets {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

.preset-btn {
  background: #2a2a2a;
  color: #ccc;
  border: 1px solid #444;
  padding: 0.3rem 0.8rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
}

.preset-btn:hover {
  background: #3a3a3a;
}

.preset-btn.active {
  background: #4a90e2;
  color: #fff;
  border-color: #5aa0f2;
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

.nijirigoke-bud {
  background: #3a3a00;
  color: #cccc00;
}

.nijirigoke-flower {
  background: #3a1a2a;
  color: #ff69b4;
  animation: flower-glow 1s ease-in-out infinite;
}

@keyframes flower-glow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.nijirigoke-withered {
  background: #2a2a2a;
  color: #888888;
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

.summon-hero-btn {
  background: #4d4d1a;
  color: #ffd700;
  border: 1px solid #ffd700;
  font-weight: bold;
}

.summon-hero-btn:hover {
  background: #6a6a2a;
}

.hero-timer {
  color: #88aaff;
}

.hero-timer-urgent {
  color: #ff4444;
  font-weight: bold;
  animation: blink 0.5s ease-in-out infinite;
}

.placement-banner {
  background: #4d1a4d;
  color: #ff44ff;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: 2px solid #ff44ff;
  animation: placement-pulse 1.5s ease-in-out infinite;
}

@keyframes placement-pulse {
  0%, 100% { border-color: #ff44ff; }
  50% { border-color: #aa22aa; }
}

.hero-cell {
  background: #4d4d1a;
  color: #ffd700;
  font-weight: bold;
}

.hero-returning {
  background: #4d3a1a;
  color: #ff8c00;
  animation: hero-blink 0.5s ease-in-out infinite;
}

@keyframes hero-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.entrance-cell {
  background: #2a2a4d;
  color: #88aaff;
}

.demon-lord-cell {
  background: #4d1a4d;
  color: #ff44ff;
  font-weight: bold;
}

.game-over-banner {
  background: #c62828;
  color: #fff;
  text-align: center;
  font-size: 2rem;
  font-weight: bold;
  padding: 1rem;
  margin-bottom: 1rem;
  border-radius: 8px;
  animation: game-over-pulse 1s ease-in-out infinite;
}

@keyframes game-over-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}

.hero-status {
  color: #ffd700;
  margin-top: 0.25rem;
}

.hero-badge {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.1rem 0.4rem;
  background: #3a3a1a;
  border: 1px solid #ffd700;
  border-radius: 4px;
  font-size: 0.8rem;
}

.nest-cell {
  outline: 2px solid #ef5350;
  outline-offset: -2px;
  background-color: #2a1515 !important;
}

.cell-empty.nest-cell {
  background-color: #2a1515 !important;
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
