/**
 * 生態系バランス検証スクリプト
 *
 * 実行: docker compose run --rm app pnpm exec npx tsx src/debug-ecosystem.ts
 */
import type { Cell, GameState, Monster } from './core/types'
import { tick } from './core/simulation'
import { getTotalNutrients } from './core/nutrient'
import { MONSTER_CONFIGS, BUD_NUTRIENT_THRESHOLD, BUD_LIFE_THRESHOLD } from './core/constants'
import { createSeededRandom } from './core/random'
import { createDefaultConfig } from './core/config'
import type { HeroEntity } from './core/hero/types'

// === グリッド作成 (20x15, 内部はsoil+養分あり) ===
function createGrid(width: number, height: number): Cell[][] {
  const grid: Cell[][] = []
  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0, magicAmount: 0 })
      } else {
        // 内部はsoil with nutrients
        row.push({ type: 'soil', nutrientAmount: 3, magicAmount: 0 })
      }
    }
    grid.push(row)
  }
  return grid
}

// === 状態作成 ===
function makeState(): GameState {
  const width = 20
  const height = 15
  const grid = createGrid(width, height)

  // 通路状のempty空間を作る（soilに常に隣接する環境）
  // 横通路: y=4, y=7, y=10 に x=2..17 のempty通路
  for (const y of [4, 7, 10]) {
    for (let x = 2; x <= 17; x++) {
      grid[y][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
    }
  }
  // 縦通路: x=5, x=10, x=15 に y=2..12 のempty通路
  for (const x of [5, 10, 15]) {
    for (let y = 2; y <= 12; y++) {
      grid[y][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
    }
  }
  // → 通路のemptyセルは必ずsoil(養分3)に隣接している

  // モンスターを手動配置
  const monsters: Monster[] = []
  let id = 0

  // ニジリゴケ 8匹 (通路上、soilに隣接)
  const nijiPositions = [
    { x: 3, y: 4 }, { x: 7, y: 4 }, { x: 12, y: 4 }, { x: 16, y: 4 },
    { x: 5, y: 6 }, { x: 10, y: 6 }, { x: 15, y: 9 }, { x: 5, y: 10 },
  ]
  for (const pos of nijiPositions) {
    id++
    const config = MONSTER_CONFIGS.nijirigoke
    monsters.push({
      id: `monster-${id}`,
      type: 'nijirigoke',
      position: pos,
      direction: 'right',
      pattern: config.pattern,
      phase: 'mobile',
      phaseTickCounter: 0,
      life: config.life, // 24 (変更後)
      maxLife: config.life,
      attack: config.attack,
      predationTargets: [...config.predationTargets],
      carryingNutrient: 0,
      nestPosition: null,
      nestOrientation: null,
    })
  }

  // ガジガジムシ 3匹 (通路の交差点付近)
  const gajiPositions = [{ x: 5, y: 4 }, { x: 10, y: 7 }, { x: 15, y: 10 }]
  for (const pos of gajiPositions) {
    id++
    const config = MONSTER_CONFIGS.gajigajimushi
    monsters.push({
      id: `monster-${id}`,
      type: 'gajigajimushi',
      position: pos,
      direction: 'right',
      pattern: config.pattern,
      phase: 'larva',
      phaseTickCounter: 0,
      life: config.life,
      maxLife: config.life,
      attack: config.attack,
      predationTargets: [...config.predationTargets],
      carryingNutrient: 0,
      nestPosition: null,
      nestOrientation: null,
    })
  }

  const config = createDefaultConfig()

  const totalNutrients = getTotalNutrients({
    grid,
    monsters,
    totalInitialNutrients: 0,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: id,
    heroes: [] as HeroEntity[],
    entrancePosition: { x: 10, y: 0 },
    demonLordPosition: null,
    heroSpawnConfig: { partySize: 1, spawnStartTick: 9999, spawnInterval: 10, heroesSpawned: 0 },
    nextHeroId: 0,
    isGameOver: false,
    config,
  })

  return {
    grid,
    monsters,
    totalInitialNutrients: totalNutrients,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: id,
    heroes: [] as HeroEntity[],
    entrancePosition: { x: 10, y: 0 },
    demonLordPosition: null,
    heroSpawnConfig: { partySize: 1, spawnStartTick: 9999, spawnInterval: 10, heroesSpawned: 0 },
    nextHeroId: 0,
    isGameOver: false,
    config,
  }
}

// === 実行 ===
const randomFn = createSeededRandom(42)
let state = makeState()

const initialNutrients = getTotalNutrients(state)
console.log(`=== 生態系バランス検証 ===`)
console.log(`初期養分: ${initialNutrients}`)
console.log(`初期モンスター: ${state.monsters.length}匹`)
console.log(`  苔: ${state.monsters.filter(m => m.type === 'nijirigoke').length}`)
console.log(`  虫: ${state.monsters.filter(m => m.type === 'gajigajimushi').length}`)
console.log(`  蜥: ${state.monsters.filter(m => m.type === 'lizardman').length}`)
console.log(`ニジリゴケ maxLife: ${MONSTER_CONFIGS.nijirigoke.life}`)
console.log(`BUD条件: nut>=${BUD_NUTRIENT_THRESHOLD}, life<=${BUD_LIFE_THRESHOLD}`)
console.log()

let budSeen = false
let flowerSeen = false
let witheredSeen = false
let reproductionSeen = false
let gajiPupaSeen = false
let gajiAdultSeen = false
const gajiReproSeen = false

for (let i = 0; i < 300; i++) {
  const result = tick(state, randomFn)
  state = result.state

  // 最初の10tickは苔の詳細を出力
  if (state.gameTime <= 10) {
    for (const m of state.monsters.filter(m => m.type === 'nijirigoke').slice(0, 2)) {
      const adj = ['up','down','left','right'].map(d => {
        const dx = d === 'left' ? -1 : d === 'right' ? 1 : 0
        const dy = d === 'up' ? -1 : d === 'down' ? 1 : 0
        const nx = m.position.x + dx, ny = m.position.y + dy
        if (ny >= 0 && ny < state.grid.length && nx >= 0 && nx < state.grid[0].length) {
          return `${d[0]}:${state.grid[ny][nx].type}(${state.grid[ny][nx].nutrientAmount})`
        }
        return `${d[0]}:wall`
      }).join(' ')
      console.log(`  [t${state.gameTime}] ${m.id} pos(${m.position.x},${m.position.y}) dir=${m.direction} life=${m.life} nut=${m.carryingNutrient} 隣接:[${adj}]`)
    }
  }

  // フェーズ追跡
  for (const m of state.monsters) {
    if (m.type === 'nijirigoke') {
      if (m.phase === 'bud' && !budSeen) {
        budSeen = true
        console.log(`[t${state.gameTime}] ★ 苔 bud到達! ${m.id} life=${m.life}/${m.maxLife} nut=${m.carryingNutrient}`)
      }
      if (m.phase === 'flower' && !flowerSeen) {
        flowerSeen = true
        console.log(`[t${state.gameTime}] ★ 苔 flower到達! ${m.id} life=${m.life}/${m.maxLife} nut=${m.carryingNutrient}`)
      }
      if (m.phase === 'withered' && !witheredSeen) {
        witheredSeen = true
        console.log(`[t${state.gameTime}] ★ 苔 withered到達! ${m.id} life=${m.life}/${m.maxLife} nut=${m.carryingNutrient}`)
      }
    }
    if (m.type === 'gajigajimushi') {
      if (m.phase === 'pupa' && !gajiPupaSeen) {
        gajiPupaSeen = true
        console.log(`[t${state.gameTime}] ★ 虫 pupa到達! ${m.id} life=${m.life}/${m.maxLife} nut=${m.carryingNutrient}`)
      }
      if (m.phase === 'adult' && !gajiAdultSeen) {
        gajiAdultSeen = true
        console.log(`[t${state.gameTime}] ★ 虫 adult到達! ${m.id} life=${m.life}/${m.maxLife} nut=${m.carryingNutrient}`)
      }
    }
  }

  // 繁殖イベント検出
  for (const e of result.events) {
    if (e.type === 'MONSTER_REPRODUCED') {
      if (!reproductionSeen) {
        reproductionSeen = true
        console.log(`[t${state.gameTime}] ★★ 繁殖成功! ${e.parentId} → ${(e as Record<string, unknown>).offspringIds ? ((e as Record<string, unknown>).offspringIds as unknown[]).length : '?'}匹`)
      }
    }
  }

  // withered 状態の苔を詳しく追跡
  for (const m of state.monsters) {
    if (m.type === 'nijirigoke' && m.phase === 'withered') {
      const surrounding = [];
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const ny = m.position.y + dy, nx = m.position.x + dx;
          if (ny >= 0 && ny < state.grid.length && nx >= 0 && nx < state.grid[0].length) {
            surrounding.push(`(${nx},${ny})=${state.grid[ny][nx].type}`);
          }
        }
      }
      console.log(`[t${state.gameTime}] withered ${m.id} pos(${m.position.x},${m.position.y}) life=${m.life} nut=${m.carryingNutrient} 周囲: ${surrounding.join(' ')}`);
    }
  }

  // イベント全出力 (繁殖関連)
  for (const e of result.events) {
    if (e.type === 'MONSTER_DIED' || e.type === 'MONSTER_REPRODUCED' || e.type === 'PHASE_TRANSITION') {
      console.log(`[t${state.gameTime}] event: ${e.type} ${JSON.stringify(e).substring(0, 120)}`);
    }
  }

  // 10tickごとにサマリー
  if (state.gameTime % 50 === 0) {
    const types: Record<string, number> = {}
    state.monsters.forEach(m => { types[m.type] = (types[m.type] || 0) + 1 })
    const currentNut = getTotalNutrients(state)
    console.log(`[t${state.gameTime}] 苔=${types.nijirigoke||0} 虫=${types.gajigajimushi||0} 蜥=${types.lizardman||0} 計=${state.monsters.length} 養分=${currentNut}/${initialNutrients}`)
  }
}

// 最終結果
console.log()
console.log(`=== 最終結果 (${state.gameTime} ticks) ===`)
const finalNut = getTotalNutrients(state)
console.log(`養分: ${finalNut}/${initialNutrients} (差: ${finalNut - initialNutrients})`)
const types: Record<string, number> = {}
state.monsters.forEach(m => { types[m.type] = (types[m.type] || 0) + 1 })
console.log(`モンスター: 苔=${types.nijirigoke||0} 虫=${types.gajigajimushi||0} 蜥=${types.lizardman||0} 計=${state.monsters.length}`)
console.log()
console.log(`フェーズ到達:`)
console.log(`  苔 bud: ${budSeen ? '✓' : '✗'}`)
console.log(`  苔 flower: ${flowerSeen ? '✓' : '✗'}`)
console.log(`  苔 withered: ${witheredSeen ? '✓' : '✗'}`)
console.log(`  苔 繁殖: ${reproductionSeen ? '✓' : '✗'}`)
console.log(`  虫 pupa: ${gajiPupaSeen ? '✓' : '✗'}`)
console.log(`  虫 adult: ${gajiAdultSeen ? '✓' : '✗'}`)
console.log(`  虫 繁殖: ${gajiReproSeen ? '✓' : '✗'}`)
