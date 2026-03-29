/**
 * デバッグスクリプト: リザードマン産卵シナリオ
 *
 * 固定乱数でゲームを再現可能に実行し、各tickの状態を出力する
 *
 * 実行: docker compose run --rm app pnpm exec tsx src/debug.ts
 */
import type { Cell, GameState, Monster, GameEvent } from './core/types'
import { tick, dig } from './core/simulation'
import { initializeNutrients, getTotalNutrients } from './core/nutrient'
import { createDefaultConfig } from './core/config'
import {
  LAYING_NUTRIENT_THRESHOLD,
  LAYING_LIFE_THRESHOLD,
  LAYING_DURATION,
  EGG_HATCH_DURATION,
  MONSTER_CONFIGS,
} from './core/constants'

import { createSeededRandom } from './core/random'

// === グリッド作成ヘルパー ===
function createGrid(width: number, height: number): Cell[][] {
  const grid: Cell[][] = []
  for (let y = 0; y < height; y++) {
    const row: Cell[] = []
    for (let x = 0; x < width; x++) {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        row.push({ type: 'wall', nutrientAmount: 0, magicAmount: 0 })
      } else {
        row.push({ type: 'soil', nutrientAmount: 0, magicAmount: 0 })
      }
    }
    grid.push(row)
  }
  return grid
}

// === 状態表示 ===
function printMonster(m: Monster) {
  const nest = m.nestPosition ? `nest(${m.nestPosition.x},${m.nestPosition.y})` : 'no-nest'
  const atNest = m.nestPosition
    ? m.position.x === m.nestPosition.x && m.position.y === m.nestPosition.y
      ? ' [AT NEST]'
      : ''
    : ''
  console.log(
    `  ${m.id}: ${m.type} phase=${m.phase} pos(${m.position.x},${m.position.y}) ` +
      `life=${m.life}/${m.maxLife} nutrient=${m.carryingNutrient} ` +
      `${nest}${atNest} phaseTick=${m.phaseTickCounter}`
  )
}

function printEvents(events: GameEvent[]) {
  for (const e of events) {
    switch (e.type) {
      case 'PHASE_TRANSITION':
        console.log(`  >> PHASE: ${e.monsterId} ${e.oldPhase} → ${e.newPhase}`)
        break
      case 'EGG_LAID':
        console.log(
          `  >> EGG LAID: parent=${e.parentId} egg=${e.eggId} pos(${e.position.x},${e.position.y})`
        )
        break
      case 'EGG_HATCHED':
        console.log(`  >> EGG HATCHED: ${e.offspringId} pos(${e.position.x},${e.position.y})`)
        break
      case 'MONSTER_REPRODUCED':
        console.log(`  >> REPRODUCED: parent=${e.parentId} offspring=${e.offspringIds.join(',')}`)
        break
      case 'MONSTER_DIED':
        console.log(`  >> DIED: ${e.monster.id} (${e.cause})`)
        break
      case 'MONSTER_SPAWNED':
        console.log(`  >> SPAWNED: ${e.monster.id} ${e.monster.type}`)
        break
      default:
        break
    }
  }
}

function printGrid(grid: Cell[][], monsters: Monster[]) {
  const monsterMap = new Map<string, Monster>()
  for (const m of monsters) {
    monsterMap.set(`${m.position.x},${m.position.y}`, m)
  }

  const symbols: Record<string, string> = {
    wall: '##',
    soil: '░░',
    empty: '  ',
  }
  const monsterSymbols: Record<string, string> = {
    nijirigoke: 'Nj',
    gajigajimushi: 'Gj',
    lizardman: 'Lz',
  }
  const phaseSymbols: Record<string, string> = {
    egg: '卵',
    laying: 'L産',
    pupa: 'G蛹',
    bud: 'N芽',
    flower: 'N花',
    withered: 'N枯',
  }

  for (let y = 0; y < grid.length; y++) {
    let line = ''
    for (let x = 0; x < grid[0].length; x++) {
      const m = monsterMap.get(`${x},${y}`)
      if (m) {
        line += phaseSymbols[m.phase] || monsterSymbols[m.type] || '??'
      } else {
        line += symbols[grid[y][x].type] || '??'
      }
    }
    console.log(line)
  }
}

// === シナリオ: リザードマン産卵 ===
function scenarioLizardmanEggLaying() {
  console.log('=== シナリオ: リザードマン産卵テスト ===')
  console.log()
  console.log('条件:')
  console.log(`  LAYING_NUTRIENT_THRESHOLD = ${LAYING_NUTRIENT_THRESHOLD}`)
  console.log(`  LAYING_LIFE_THRESHOLD = ${LAYING_LIFE_THRESHOLD}`)
  console.log(`  LAYING_DURATION = ${LAYING_DURATION} ticks`)
  console.log(`  EGG_HATCH_DURATION = ${EGG_HATCH_DURATION} ticks`)
  console.log(`  Lizardman maxLife = ${MONSTER_CONFIGS.lizardman.life}`)
  console.log()

  const random = createSeededRandom(42)
  const width = 12
  const height = 10

  // グリッド構築: 中央にリザードマン用の空間を作る
  const grid = createGrid(width, height)

  // 空洞エリアを作成（リザードマンが歩ける場所）
  for (let y = 2; y <= 7; y++) {
    for (let x = 2; x <= 9; x++) {
      grid[y][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
    }
  }

  // リザードマンを掘削で生成するため、高養分の土を配置
  // lizardman閾値 = 17, maxLife = 80
  // 養分100のsoilを用意: life=min(100,80)=80, carried=min(20,10)=10, surplus=10
  grid[4][5] = { type: 'soil', nutrientAmount: 100, magicAmount: 0 }

  // 養分を初期化（残りのsoilに養分を分配）
  const { grid: initializedGrid } = initializeNutrients(grid, 200)
  // 手動で配置したsoilの養分を上書き（initializeで変わった可能性）
  initializedGrid[4][5] = { type: 'soil', nutrientAmount: 100, magicAmount: 0 }

  const baseState: Omit<GameState, 'totalInitialNutrients'> = {
    grid: initializedGrid,
    monsters: [],
    heroes: [],
    entrancePosition: { x: 5, y: 0 },
    demonLordPosition: null,
    heroSpawnConfig: { partySize: 1, spawnStartTick: 100, spawnInterval: 10, heroesSpawned: 0 },
    digPower: 100,
    gameTime: 0,
    nextMonsterId: 0,
    nextHeroId: 0,
    isGameOver: false,
    config: createDefaultConfig(),
  }
  const state: GameState = {
    ...baseState,
    totalInitialNutrients: getTotalNutrients({ ...baseState, totalInitialNutrients: 0 }),
  }

  console.log('--- 初期グリッド ---')
  printGrid(state.grid, state.monsters)
  console.log()

  // Step 1: 掘削してリザードマンを生成
  console.log('=== DIG at (5,4) - リザードマン生成 ===')
  const digResult = dig(state, { x: 5, y: 4 }, random)
  if ('error' in digResult) {
    console.log(`ERROR: ${digResult.error}`)
    return
  }

  let currentState = digResult.state
  printEvents(digResult.events)
  console.log()

  for (const m of currentState.monsters) {
    printMonster(m)
  }
  console.log()

  // リザードマンに手動で養分と巣を設定（掘削だけでは条件が足りない場合）
  const lizardman = currentState.monsters.find((m) => m.type === 'lizardman')
  if (!lizardman) {
    console.log('ERROR: リザードマンが生成されなかった')
    console.log(`  掘削セルの養分: 100, 閾値: GAJIGAJIMUSHI=${10}, LIZARDMAN=${17}`)
    return
  }

  // 条件を手動で整える（デバッグ用）
  console.log('=== 手動で産卵条件を整える ===')
  const preparedMonsters = currentState.monsters.map((m) => {
    if (m.type === 'lizardman') {
      return {
        ...m,
        carryingNutrient: LAYING_NUTRIENT_THRESHOLD + 5, // 閾値以上
        life: LAYING_LIFE_THRESHOLD + 10, // 閾値以上
        nestPosition: { x: 5, y: 4 }, // 巣を設定
        nestOrientation: 'horizontal' as const, // 巣の向き
        position: { x: 5, y: 4 }, // 巣位置にいる
      }
    }
    return m
  })
  currentState = { ...currentState, monsters: preparedMonsters }

  console.log('準備後のモンスター:')
  for (const m of currentState.monsters) {
    printMonster(m)
  }
  console.log()

  // Step 2: tickを回して産卵～孵化を観察
  const maxTicks = LAYING_DURATION + EGG_HATCH_DURATION + 10
  console.log(`=== ${maxTicks} ticks 実行開始 ===`)
  console.log()

  for (let t = 0; t < maxTicks; t++) {
    const result = tick(currentState, random)
    currentState = result.state

    // イベントがあるtickだけ詳細表示
    const importantEvents = result.events.filter((e) =>
      [
        'PHASE_TRANSITION',
        'EGG_LAID',
        'EGG_HATCHED',
        'MONSTER_REPRODUCED',
        'MONSTER_DIED',
      ].includes(e.type)
    )

    if (importantEvents.length > 0 || t % 10 === 0 || t === maxTicks - 1) {
      console.log(`--- tick ${currentState.gameTime} ---`)
      for (const m of currentState.monsters) {
        printMonster(m)
      }
      if (importantEvents.length > 0) {
        printEvents(importantEvents)
      }
      console.log()
    }

    // 卵が孵化したら終了
    if (result.events.some((e) => e.type === 'EGG_HATCHED')) {
      console.log('=== 孵化成功！ ===')
      break
    }
  }

  console.log('--- 最終グリッド ---')
  printGrid(currentState.grid, currentState.monsters)
  console.log()
  console.log(`総養分: ${getTotalNutrients(currentState)}`)
  console.log(`モンスター数: ${currentState.monsters.length}`)
}

// === 実行 ===
scenarioLizardmanEggLaying()
