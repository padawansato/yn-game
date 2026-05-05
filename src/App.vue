<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import {
  tick,
  dig,
  getTotalNutrients,
  GameLoop,
  createSeededRandom,
  type GameState,
} from './core'
import { type GameConfig } from './core/config'
import { GRID_PRESETS, type GridPresetKey } from './core/constants'
import GridView from './components/GridView.vue'
import { formatEvent } from './event-format'
import { computeMonsterSummary } from './monster-summary'
import { createConfigForPreset, createInitialState } from './state-init'
import { SCENARIOS, type Scenario } from './scenarios'

const activePresetKey = ref<GridPresetKey>('small')
const gameConfig = ref<GameConfig>(createConfigForPreset(activePresetKey.value))
const gameState = ref<GameState>(createInitialState(gameConfig.value))
const events = ref<string[]>([])
const isRunning = ref(false)
const isPaused = ref(false)
const isPlacingDemonLord = ref(false)
const heroesTriggered = ref(false)

let seededRandom: (() => number) | null = null
let gameLoop: GameLoop | null = null

function triggerHeroPhase() {
  heroesTriggered.value = true
  isPlacingDemonLord.value = true
  pauseGame()
  events.value.unshift(`[HERO_PHASE] 勇者が来る! 魔王を配置してください!`)
}

function executeTickWithEvents() {
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

function initGameLoop() {
  gameLoop = new GameLoop(() => executeTickWithEvents(), 500)
}

initGameLoop()
onUnmounted(() => gameLoop?.stop())

function handleCellClick(payload: { x: number; y: number }) {
  const { x, y } = payload
  if (isPlacingDemonLord.value) {
    const cell = gameState.value.grid[y][x]
    if (cell.type !== 'empty') {
      events.value.unshift(`[Error] 魔王は空きセルにのみ配置できます`)
      return
    }
    gameState.value = {
      ...gameState.value,
      demonLordPosition: { x, y },
      heroSpawnConfig: { ...gameState.value.heroSpawnConfig, spawnStartTick: gameState.value.gameTime },
    }
    isPlacingDemonLord.value = false
    events.value.unshift(`[DEMON_LORD_PLACED] 魔王を (${x},${y}) に配置 — 勇者が来る!`)
    if (isRunning.value) resumeGame()
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
  seededRandom = null
  gameState.value = createInitialState(gameConfig.value)
  events.value = []
  heroesTriggered.value = false
  isPlacingDemonLord.value = false
  initGameLoop()
}

function selectPreset(key: GridPresetKey) {
  if (activePresetKey.value === key && !isRunning.value) {
    handleReset()
    return
  }
  stopGame()
  activePresetKey.value = key
  gameConfig.value = createConfigForPreset(key)
  seededRandom = null
  gameState.value = createInitialState(gameConfig.value)
  events.value = []
  heroesTriggered.value = false
  isPlacingDemonLord.value = false
  initGameLoop()
}

function loadScenario(scenario: Scenario) {
  stopGame()
  gameState.value = scenario.build(gameConfig.value)
  events.value = [`[SCENARIO] ${scenario.message}`]
  seededRandom = createSeededRandom(42)
  initGameLoop()
}

const scenarios = SCENARIOS.map((s) => ({
  name: s.name,
  description: s.description,
  setup: () => loadScenario(s),
}))

;(window as unknown as Record<string, unknown>).__state = gameState
;(window as unknown as Record<string, unknown>).__monsters = computed(() =>
  gameState.value.monsters.map((m) => ({
    id: m.id,
    type: m.type,
    phase: m.phase,
    pos: `${m.position.x},${m.position.y}`,
    life: `${m.life}/${m.maxLife}`,
    nutrient: m.carryingNutrient,
    nest: m.nestPosition ? `${m.nestPosition.x},${m.nestPosition.y}` : null,
    phaseTick: m.phaseTickCounter,
  })),
)

const totalNutrients = computed(() => getTotalNutrients(gameState.value))
const monsterSummary = computed(() => computeMonsterSummary(gameState.value.monsters))
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

<style src="./App.css"></style>
