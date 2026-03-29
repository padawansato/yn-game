#!/usr/bin/env node
/**
 * yn-game CLI Debug Mode
 *
 * Usage: docker compose run --rm -it app pnpm exec npx tsx src/cli.ts [--seed N]
 */
import * as readline from 'readline'
import { createGameState, initializeNutrients, tick, dig } from './core'
import { createSeededRandom } from './core/random'
import type { GameState } from './core/types'
import { parseCommand, getHelpText } from './cli/commands'
import { renderGrid, renderMonsterList, renderMonsterDetail, renderEvents, renderStatus } from './cli/display'
import { getScenarios, loadScenario } from './cli/scenarios'

// --- State ---
let state: GameState
let randomFn: () => number
let seed: number
let autoRunTimer: ReturnType<typeof setInterval> | null = null

// --- Initialization ---
function parseSeedArg(): number {
  const idx = process.argv.indexOf('--seed')
  if (idx !== -1 && process.argv[idx + 1]) {
    const val = Number(process.argv[idx + 1])
    if (Number.isFinite(val)) return val
  }
  return 42
}

function createDefaultState(): GameState {
  const base = createGameState(10, 8, 1.0)
  const { grid } = initializeNutrients(base.grid, 200, base.config)
  return { ...base, grid, totalInitialNutrients: 200 }
}

function initGame(s: number) {
  seed = s
  randomFn = createSeededRandom(seed)
  state = createDefaultState()
}

// --- Command handlers ---
function handleDig(x: number, y: number) {
  const result = dig(state, { x, y }, randomFn)
  if ('error' in result) {
    console.log(`Error: ${result.error}`)
  } else {
    state = result.state
    const eventLines = renderEvents(result.events)
    eventLines.forEach((l) => console.log(`  ${l}`))
    console.log(renderGrid(state.grid, state.monsters))
    console.log(renderStatus(state))
  }
}

function handleTick(count: number) {
  for (let i = 0; i < count; i++) {
    const result = tick(state, randomFn)
    state = result.state
    const eventLines = renderEvents(result.events)
    if (eventLines.length > 0) {
      console.log(`--- tick ${state.gameTime} ---`)
      eventLines.forEach((l) => console.log(`  ${l}`))
    }
  }
  if (count > 1) {
    console.log(renderStatus(state))
  }
}

function handleRun(_rl: readline.Interface) {
  if (autoRunTimer) {
    console.log('Already running. Use "stop" to stop.')
    return
  }
  console.log('Running... (type "stop" to stop)')
  autoRunTimer = setInterval(() => {
    const result = tick(state, randomFn)
    state = result.state
    const eventLines = renderEvents(result.events)
    if (eventLines.length > 0) {
      console.log(`--- tick ${state.gameTime} ---`)
      eventLines.forEach((l) => console.log(`  ${l}`))
    }
  }, 500)
}

function handleStop() {
  if (autoRunTimer) {
    clearInterval(autoRunTimer)
    autoRunTimer = null
    console.log('Stopped.')
    console.log(renderStatus(state))
  } else {
    console.log('Not running.')
  }
}

function handleScenario(name: string) {
  const newState = loadScenario(name)
  if (!newState) {
    console.log(`Unknown scenario: "${name}". Use "scenario list" to see available scenarios.`)
    return
  }
  state = newState
  seed = 42
  randomFn = createSeededRandom(seed)
  console.log(`[SCENARIO] Loaded: ${name}`)
  console.log(renderGrid(state.grid, state.monsters))
  console.log(renderStatus(state))
}

function handleScenarioList() {
  const scenarios = getScenarios()
  console.log('Available scenarios:')
  for (const s of scenarios) {
    console.log(`  ${s.name.padEnd(30)} ${s.description}`)
  }
}

function handleMonsters(filterType?: string) {
  const validTypes = ['nijirigoke', 'gajigajimushi', 'lizardman']
  if (filterType && !validTypes.includes(filterType)) {
    console.log(`Unknown type: "${filterType}". Valid: ${validTypes.join(', ')}`)
    return
  }
  console.log(renderMonsterList(state.monsters, filterType as import('./core/types').MonsterType | undefined))
}

function handleMonsterDetail(id: string) {
  const monster = state.monsters.find((m) => m.id === id)
  if (!monster) {
    console.log(`Monster not found: "${id}"`)
    return
  }
  console.log(renderMonsterDetail(monster))
}

// --- REPL ---
function startRepl() {
  initGame(parseSeedArg())

  console.log(`yn-game CLI (seed: ${seed})`)
  console.log('='.repeat(30))
  console.log(renderGrid(state.grid, state.monsters))
  console.log(renderStatus(state))
  console.log('Type "help" for commands.\n')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'yn> ',
  })

  rl.prompt()

  rl.on('line', (line) => {
    const cmd = parseCommand(line)

    switch (cmd.type) {
      case 'dig':
        handleDig(cmd.x, cmd.y)
        break
      case 'tick':
        handleTick(cmd.count)
        break
      case 'run':
        handleRun(rl)
        break
      case 'stop':
        handleStop()
        break
      case 'status':
        console.log(renderStatus(state))
        break
      case 'grid':
        console.log(renderGrid(state.grid, state.monsters))
        break
      case 'monsters':
        handleMonsters(cmd.filterType)
        break
      case 'monster':
        handleMonsterDetail(cmd.id)
        break
      case 'scenario':
        handleScenario(cmd.name)
        break
      case 'scenario-list':
        handleScenarioList()
        break
      case 'seed': {
        seed = cmd.value
        randomFn = createSeededRandom(seed)
        console.log(`Seed set to ${seed}`)
        break
      }
      case 'reset':
        initGame(seed)
        console.log('Game reset.')
        console.log(renderGrid(state.grid, state.monsters))
        console.log(renderStatus(state))
        break
      case 'help':
        console.log(getHelpText())
        break
      case 'quit':
        if (autoRunTimer) clearInterval(autoRunTimer)
        console.log('bye')
        rl.close()
        process.exit(0)
        break
      case 'unknown':
        if (cmd.input) {
          console.log(`Unknown command: "${cmd.input}". Type "help" for available commands.`)
        }
        break
    }

    rl.prompt()
  })

  rl.on('close', () => {
    if (autoRunTimer) clearInterval(autoRunTimer)
    process.exit(0)
  })
}

startRepl()
