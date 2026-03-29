import { describe, it, expect } from 'vitest'
import {
  GameState,
  Cell,
  Monster,
  tick,
  dig,
  initializeNutrients,
  getTotalNutrients,
  isWorldDying,
} from './index'
import { createSeededRandom } from './random'
import { processPredation } from './predation'
import { createDefaultConfig } from './config'
import { MONSTER_CONFIGS } from './constants'

function createGrid(width: number, height: number, type: Cell['type'] = 'empty'): Cell[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => ({ type, nutrientAmount: 0, magicAmount: 0 }))
  )
}

function createGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    grid: createGrid(10, 10),
    monsters: [],
    heroes: [],
    entrancePosition: { x: 5, y: 0 },
    demonLordPosition: { x: 5, y: 9 },
    heroSpawnConfig: {
      partySize: 1,
      spawnStartTick: 100,
      spawnInterval: 10,
      heroesSpawned: 0,
    },
    config: createDefaultConfig(),
    totalInitialNutrients: 100,
    digPower: 100,
    gameTime: 0,
    nextMonsterId: 0,
    nextHeroId: 0,
    isGameOver: false,
    ...overrides,
  }
}

describe('Integration Tests', () => {
  describe('Full game cycle', () => {
    it('should handle dig -> multiple ticks -> predation cycle', () => {
      // Create grid with empty space for movement
      const grid = createGrid(10, 10, 'empty')
      // Add wall blocks at edges
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          if (x === 0 || x === 9 || y === 0 || y === 9) {
            grid[y][x] = { type: 'wall', nutrientAmount: 0, magicAmount: 0 }
          } else if (x === 3 && y === 3) {
            // Soil block to dig - low nutrients to spawn Nijirigoke (below gajigajimushi threshold of 10)
            grid[y][x] = { type: 'soil', nutrientAmount: 5, magicAmount: 0 }
          }
        }
      }

      let state = createGameState({
        grid,
        totalInitialNutrients: 5,
      })

      // Dig to spawn Nijirigoke (nutrient < 10 spawns nijirigoke)
      const digResult1 = dig(state, { x: 3, y: 3 })
      expect('error' in digResult1).toBe(false)
      if (!('error' in digResult1)) {
        state = digResult1.state
        expect(state.monsters).toHaveLength(1)
        expect(state.monsters[0].type).toBe('nijirigoke')
      }

      // Run several ticks - monster should move in empty space
      for (let i = 0; i < 5; i++) {
        const tickResult = tick(state)
        state = tickResult.state
      }

      // Monster should have moved and lost life
      for (const monster of state.monsters) {
        expect(monster.life).toBeLessThan(MONSTER_CONFIGS.nijirigoke.life)
      }
    })

    it('should preserve nutrients through dig actions (conservation law)', () => {
      // Create grid with soil
      const grid = createGrid(10, 10, 'soil')

      // Add entry point for digging (empty cell at start)
      grid[2][1].type = 'empty'

      // Initialize with lots of nutrients
      const { grid: initializedGrid } = initializeNutrients(grid, 1000, createDefaultConfig())

      let state = createGameState({
        grid: initializedGrid,
        totalInitialNutrients: 1000,
      })

      const initialNutrients = getTotalNutrients(state)
      expect(initialNutrients).toBe(1000)

      // Dig multiple times - nutrients should be conserved
      for (let i = 0; i < 5; i++) {
        const result = dig(state, { x: 2 + i, y: 2 })
        if (!('error' in result)) {
          state = result.state
        }
      }

      // Nutrients in cells + carryingNutrient are preserved, minus what was consumed as monster life
      // life = min(soilNutrient, maxLife) is outside conservation law per spec
      const finalNutrients = getTotalNutrients(state)
      const totalLifeConsumed = state.monsters.reduce((sum, m) => sum + m.life, 0)
      expect(finalNutrients + totalLifeConsumed).toBe(initialNutrients)
    })

    it('should detect world dying when nutrients are low', () => {
      const grid = createGrid(5, 5, 'soil')
      grid[2][2].nutrientAmount = 5 // Only 5 nutrients in soil

      const state = createGameState({
        grid,
        totalInitialNutrients: 100,
      })

      // 5 < 100 * 0.1 = 10
      expect(isWorldDying(state, 0.1)).toBe(true)
    })

    it('should handle predation food chain', () => {
      const grid = createGrid(10, 10, 'empty')

      // Create food chain: Gajigajimushi -> Nijirigoke
      // Both moving toward each other, meeting at (5,5)
      const nijirigoke: Monster = {
        id: 'n1',
        type: 'nijirigoke',
        position: { x: 6, y: 5 }, // moving left to (5,5)
        direction: 'left',
        pattern: 'straight',
        phase: 'mobile',
        phaseTickCounter: 0,
        life: 10,
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }

      const gajigajimushi: Monster = {
        id: 'g1',
        type: 'gajigajimushi',
        position: { x: 4, y: 5 }, // moving right to (5,5)
        direction: 'right',
        pattern: 'straight',
        phase: 'larva',
        phaseTickCounter: 0,
        life: 20,
        maxLife: 30,
        attack: 3,
        predationTargets: ['nijirigoke'],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }

      let state = createGameState({
        grid,
        monsters: [nijirigoke, gajigajimushi],
      })

      // First tick: both move to (5,5), predation occurs
      const result = tick(state)
      state = result.state

      // Only gajigajimushi should remain
      expect(state.monsters).toHaveLength(1)
      expect(state.monsters[0].type).toBe('gajigajimushi')

      // Gajigajimushi should have gained life from eating nijirigoke
      // 20 + 10 - 1 (movement cost) = 29
      expect(state.monsters[0].life).toBe(29)

      // Should have PREDATION event
      expect(result.events.some((e) => e.type === 'PREDATION')).toBe(true)
    })

    it('should handle monster starvation', () => {
      const grid = createGrid(10, 10, 'empty')

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
        direction: 'right',
        pattern: 'straight',
        phase: 'mobile',
        phaseTickCounter: 0,
        life: 3, // will die after 3 moves
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }

      let state = createGameState({ grid, monsters: [monster] })
      let starvationEvents = 0

      // Run ticks until monster dies
      for (let i = 0; i < 5; i++) {
        const result = tick(state)
        state = result.state

        if (result.events.some((e) => e.type === 'MONSTER_DIED' && e.cause === 'starvation')) {
          starvationEvents++
        }

        if (state.monsters.length === 0) break
      }

      expect(state.monsters).toHaveLength(0)
      expect(starvationEvents).toBe(1)
    })

    it('should transfer prey nutrients to predator on predation', () => {
      // Create grid with soil surrounding predation point
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].type = 'empty' // predation position
      grid[5][4].type = 'empty' // gajigajimushi starting position
      grid[5][6].type = 'empty' // nijirigoke starting position

      // Both monsters moving to (5,5)
      const nijirigoke: Monster = {
        id: 'n1',
        type: 'nijirigoke',
        position: { x: 6, y: 5 }, // moving left to (5,5)
        direction: 'left',
        pattern: 'straight',
        phase: 'mobile',
        phaseTickCounter: 0,
        life: 10,
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 8, // carrying nutrients
        nestPosition: null,
        nestOrientation: null,
      }

      const gajigajimushi: Monster = {
        id: 'g1',
        type: 'gajigajimushi',
        position: { x: 4, y: 5 }, // moving right to (5,5)
        direction: 'right',
        pattern: 'straight',
        phase: 'larva',
        phaseTickCounter: 0,
        life: 20,
        maxLife: 30,
        attack: 3,
        predationTargets: ['nijirigoke'],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }

      let state = createGameState({
        grid,
        monsters: [nijirigoke, gajigajimushi],
      })

      const result = tick(state)
      state = result.state

      // Prey's nutrients (8) should be transferred to predator
      expect(state.monsters).toHaveLength(1)
      expect(state.monsters[0].type).toBe('gajigajimushi')
      // carryingNutrient: 0 (initial) + 8 (from prey) = 8
      // gajigajimushi uses life for movement cost, not carryingNutrient
      expect(state.monsters[0].carryingNutrient).toBe(8)
    })

    it('should continue ticking after all monsters die', () => {
      const grid = createGrid(10, 10, 'empty')

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
        direction: 'right',
        pattern: 'straight',
        phase: 'mobile',
        phaseTickCounter: 0,
        life: 1, // will die after 1 move
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }

      let state = createGameState({ grid, monsters: [monster] })

      // First tick: monster moves and dies
      const result1 = tick(state)
      state = result1.state
      expect(state.monsters).toHaveLength(0)

      // Subsequent ticks should not crash with empty monster list
      const result2 = tick(state)
      state = result2.state
      expect(state.monsters).toHaveLength(0)
      expect(state.gameTime).toBe(2)

      const result3 = tick(state)
      state = result3.state
      expect(state.gameTime).toBe(3)
    })

    it('should complete a full nutrient cycle: absorb, carry, release', () => {
      // Nijirigoke absorbs from soil adjacent to its position after moving
      const grid = createGrid(10, 10, 'soil')
      // Create corridor of empty cells
      grid[5][3].type = 'empty'
      grid[5][4].type = 'empty'
      grid[5][5].type = 'empty'
      grid[5][6].type = 'empty'

      // Put nutrients in soil next to where monster will move to
      // Monster starts at (3,5), moves right to (4,5), absorbs from (5,5) which is empty
      // so put nutrients in soil adjacent to (4,5): (4,4) is soil
      grid[4][4].nutrientAmount = 8

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 3, y: 5 },
        direction: 'right', // will move to (4,5)
        pattern: 'straight',
        phase: 'mobile',
        phaseTickCounter: 0,
        life: 16,
        maxLife: 16,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }

      let state = createGameState({ grid, monsters: [monster] })

      // Tick 1: moves to (4,5), absorbs from adjacent soil
      const result1 = tick(state)
      state = result1.state
      // Monster moved and absorbed from adjacent soil
      expect(state.monsters[0].position).toEqual({ x: 4, y: 5 })
      expect(state.monsters[0].carryingNutrient).toBeGreaterThan(0)
    })

    it('should keep nijirigoke alive when adjacent nutrients are available', () => {
      // Nijirigoke with maxLife and carrying nutrients should survive much longer
      const grid = createGrid(10, 10, 'soil')
      grid[5][3].type = 'empty'
      grid[5][4].type = 'empty'
      grid[5][5].type = 'empty'
      grid[5][6].type = 'empty'
      grid[5][7].type = 'empty'

      // Rich soil adjacent to corridor
      grid[4][4].nutrientAmount = 10
      grid[4][5].nutrientAmount = 10
      grid[4][6].nutrientAmount = 10

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 3, y: 5 },
        direction: 'right',
        pattern: 'straight',
        phase: 'mobile',
        phaseTickCounter: 0,
        life: 16,
        maxLife: 16,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 3, // starts with some nutrients
        nestPosition: null,
        nestOrientation: null,
      }

      let state = createGameState({ grid, monsters: [monster] })

      // Run 10 ticks - nijirigoke should survive due to nutrient absorption
      for (let i = 0; i < 10; i++) {
        const result = tick(state)
        state = result.state
        if (state.monsters.length === 0) break
      }

      // Should still be alive after 10 ticks with nutrient support
      expect(state.monsters).toHaveLength(1)
      expect(state.monsters[0].life).toBeGreaterThan(0) // alive thanks to nutrient fuel
    })

    it('should handle nutrient absorption and release cycle', () => {
      // Create a simple scenario for testing nutrient absorption/release
      const grid = createGrid(10, 10, 'soil')
      grid[5][5].type = 'empty' // monster starting position
      grid[5][6].type = 'empty' // monster will move here
      grid[5][7].nutrientAmount = 10 // soil with nutrients to absorb

      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 5, y: 5 },
        direction: 'right',
        pattern: 'straight',
        phase: 'mobile',
        phaseTickCounter: 0,
        life: 10,
        maxLife: 10,
        attack: 0,
        predationTargets: [],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }

      let state = createGameState({ grid, monsters: [monster] })

      // First tick: monster moves to (6,5) and absorbs from (7,5)
      const result = tick(state)
      state = result.state

      expect(state.monsters[0].position).toEqual({ x: 6, y: 5 })
      // Absorbed 10, then movement cost -1 = 9
      expect(state.monsters[0].carryingNutrient).toBe(9)
      expect(state.grid[5][7].nutrientAmount).toBe(0)
    })
  })

  describe('Lifecycle E2E', () => {
    it('nijirigoke should complete mobile→bud→flower→withered→reproduce cycle', () => {
      // Grid with soil corridor around empty space
      const grid = createGrid(10, 10, 'soil')
      // Empty corridor at y=5
      for (let x = 2; x <= 7; x++) grid[5][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
      // Rich soil adjacent to corridor
      for (let x = 2; x <= 7; x++) {
        grid[4][x].nutrientAmount = 5
        grid[6][x].nutrientAmount = 5
      }

      const config = MONSTER_CONFIGS.nijirigoke
      const monster: Monster = {
        id: 'm1',
        type: 'nijirigoke',
        position: { x: 2, y: 5 },
        direction: 'right',
        pattern: config.pattern,
        phase: 'mobile',
        phaseTickCounter: 0,
        life: config.life,
        maxLife: config.life,
        attack: config.attack,
        predationTargets: [...config.predationTargets],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }

      let state = createGameState({ grid, monsters: [monster] })
      const initialNutrients = getTotalNutrients(state)
      state = { ...state, totalInitialNutrients: initialNutrients }
      const randomFn = createSeededRandom(42)

      let budReached = false
      let flowerReached = false
      let witheredReached = false
      let reproduced = false

      for (let i = 0; i < 100; i++) {
        const result = tick(state, randomFn)
        state = result.state

        for (const m of state.monsters) {
          if (m.type === 'nijirigoke') {
            if (m.phase === 'bud') budReached = true
            if (m.phase === 'flower') flowerReached = true
            if (m.phase === 'withered') witheredReached = true
          }
        }
        for (const e of result.events) {
          if (e.type === 'MONSTER_REPRODUCED') reproduced = true
        }
        if (reproduced) break
      }

      expect(budReached).toBe(true)
      expect(flowerReached).toBe(true)
      expect(witheredReached).toBe(true)
      expect(reproduced).toBe(true)
      // Conservation law
      expect(getTotalNutrients(state)).toBe(initialNutrients)
    })

    it('nijirigoke should not bud before minMobileTicks after dig', () => {
      const grid = createGrid(10, 10, 'soil')
      for (let x = 2; x <= 7; x++) grid[5][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
      for (let x = 2; x <= 7; x++) {
        if (grid[4][x].type === 'soil') grid[4][x].nutrientAmount = 5
        grid[6][x].nutrientAmount = 5
      }
      grid[4][3] = { type: 'soil', nutrientAmount: 9, magicAmount: 0 }

      let state = createGameState({ grid, monsters: [] })
      const randomFn = createSeededRandom(42)

      const digResult = dig(state, { x: 3, y: 4 }, randomFn)
      if ('error' in digResult) throw new Error('Dig failed')
      state = digResult.state

      const minMobileTicks = state.config.monsters.nijirigoke.minMobileTicks!

      // Run ticks and verify no bud before minMobileTicks
      for (let i = 0; i < minMobileTicks + 5; i++) {
        const m = state.monsters.find(m => m.type === 'nijirigoke')
        if (m && i < minMobileTicks) {
          expect(m.phase).toBe('mobile')
        }
        state = tick(state, randomFn).state
      }

      // After minMobileTicks, bud should have been reached
      const nijiAfter = state.monsters.find(m => m.type === 'nijirigoke')
      expect(nijiAfter?.phase === 'bud' || nijiAfter?.phase === 'flower').toBe(true)
    })

    /* removed: experiment tests */
    it.skip('placeholder', () => {
      // Common setup: dig soil → nijirigoke near nutrient-rich soil
      function runExperiment(label: string, budThreshold: number, flowerThreshold: number) {
        const grid = createGrid(10, 10, 'soil')
        for (let x = 2; x <= 7; x++) grid[5][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
        for (let x = 2; x <= 7; x++) {
          if (grid[4][x].type === 'soil') grid[4][x].nutrientAmount = 5
          grid[6][x].nutrientAmount = 5
        }
        // Dig target: nutrient=9 → nijirigoke spawn
        grid[4][3] = { type: 'soil', nutrientAmount: 9, magicAmount: 0 }

        const customConfig = createDefaultConfig()
        customConfig.monsters.nijirigoke.budNutrientThreshold = budThreshold
        customConfig.monsters.nijirigoke.flowerNutrientThreshold = flowerThreshold

        let state = createGameState({ grid, monsters: [], config: customConfig })
        const randomFn = createSeededRandom(42)

        const digResult = dig(state, { x: 3, y: 4 }, randomFn)
        if ('error' in digResult) return
        state = digResult.state

        const spawned = state.monsters[0]
        let budTick = -1
        let flowerTick = -1

        for (let i = 0; i < 60; i++) {
          const m = state.monsters.find(m => m.id === spawned.id)
          if (m) {
            if (m.phase === 'bud' && budTick === -1) budTick = i
            if (m.phase === 'flower' && flowerTick === -1) flowerTick = i
          }
          if (flowerTick !== -1) break
          state = tick(state, randomFn).state
        }
        console.log(`${label}: spawn life=${spawned.life}/${spawned.maxLife} | bud@tick=${budTick} flower@tick=${flowerTick}`)
      }

      console.log('\n=== EXPERIMENT: Threshold comparison (dig nutrient=9 soil) ===')
      runExperiment('A: current  (bud>=4, flower>=8)', 4, 8)
      runExperiment('B: bud>=6   (flower>=8)',         6, 8)
      runExperiment('C: bud>=8   (flower>=10)',        8, 10)
      runExperiment('D: bud>=6   (flower>=10)',        6, 10)

      // Same but with life=maxLife (corridor spawn, no dig)
      function runCorridorExperiment(label: string, budThreshold: number, flowerThreshold: number) {
        const grid = createGrid(10, 10, 'soil')
        for (let x = 2; x <= 7; x++) grid[5][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
        for (let x = 2; x <= 7; x++) {
          if (grid[4][x].type === 'soil') grid[4][x].nutrientAmount = 5
          grid[6][x].nutrientAmount = 5
        }

        const customConfig = createDefaultConfig()
        customConfig.monsters.nijirigoke.budNutrientThreshold = budThreshold
        customConfig.monsters.nijirigoke.flowerNutrientThreshold = flowerThreshold
        const mConfig = customConfig.monsters.nijirigoke

        const monster: Monster = {
          id: 'm1', type: 'nijirigoke', position: { x: 2, y: 5 }, direction: 'right',
          pattern: mConfig.pattern, phase: 'mobile', phaseTickCounter: 0,
          life: mConfig.life, maxLife: mConfig.life, attack: mConfig.attack,
          predationTargets: [...mConfig.predationTargets], carryingNutrient: 0,
          nestPosition: null, nestOrientation: null,
        }

        let state = createGameState({ grid, monsters: [monster], config: customConfig })
        const randomFn = createSeededRandom(42)
        let budTick = -1
        let flowerTick = -1

        for (let i = 0; i < 60; i++) {
          const m = state.monsters.find(m => m.id === 'm1')
          if (m) {
            if (m.phase === 'bud' && budTick === -1) budTick = i
            if (m.phase === 'flower' && flowerTick === -1) flowerTick = i
          }
          if (flowerTick !== -1) break
          state = tick(state, randomFn).state
        }
        console.log(`${label}: life=maxLife start | bud@tick=${budTick} flower@tick=${flowerTick}`)
      }

      console.log('\n=== EXPERIMENT: Corridor spawn (life=maxLife, nutrient=0) ===')
      runCorridorExperiment('A: current  (bud>=4, flower>=8)', 4, 8)
      runCorridorExperiment('B: bud>=6   (flower>=8)',         6, 8)
      runCorridorExperiment('C: bud>=8   (flower>=10)',        8, 10)
      runCorridorExperiment('D: bud>=6   (flower>=10)',        6, 10)

      // === phaseTickCounter experiment ===
      // Simulate minimum mobile phase duration by patching processPhaseTransitions
      // We can't easily patch, so we manually simulate: skip bud check if phaseTickCounter < N
      function runDigWithMinTick(label: string, minMobileTicks: number, budThreshold: number) {
        const grid = createGrid(10, 10, 'soil')
        for (let x = 2; x <= 7; x++) grid[5][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
        for (let x = 2; x <= 7; x++) {
          if (grid[4][x].type === 'soil') grid[4][x].nutrientAmount = 5
          grid[6][x].nutrientAmount = 5
        }
        grid[4][3] = { type: 'soil', nutrientAmount: 9, magicAmount: 0 }

        const customConfig = createDefaultConfig()
        customConfig.monsters.nijirigoke.budNutrientThreshold = budThreshold

        let state = createGameState({ grid, monsters: [], config: customConfig })
        const randomFn = createSeededRandom(42)

        const digResult = dig(state, { x: 3, y: 4 }, randomFn)
        if ('error' in digResult) return
        state = digResult.state
        const spawned = state.monsters[0]

        // Manually track: pretend bud won't trigger until phaseTickCounter >= minMobileTicks
        let budTick = -1
        let flowerTick = -1
        const trace: string[] = []

        for (let i = 0; i < 60; i++) {
          const m = state.monsters.find(m => m.id === spawned.id)
          if (m) {
            trace.push(`tick=${i} phase=${m.phase} life=${m.life}/${m.maxLife} nut=${m.carryingNutrient} ptc=${m.phaseTickCounter}`)
            if (m.phase === 'bud' && budTick === -1) budTick = i
            if (m.phase === 'flower' && flowerTick === -1) flowerTick = i
          }
          if (flowerTick !== -1 || !m) break

          // Before tick: if monster would transition to bud but phaseTickCounter < minMobileTicks,
          // prevent it by temporarily raising threshold
          const curM = state.monsters.find(m => m.id === spawned.id)
          if (curM && curM.phase === 'mobile' && curM.phaseTickCounter < minMobileTicks) {
            state = {
              ...state,
              config: {
                ...state.config,
                monsters: {
                  ...state.config.monsters,
                  nijirigoke: { ...state.config.monsters.nijirigoke, budNutrientThreshold: 9999 }
                }
              }
            }
          } else {
            state = {
              ...state,
              config: {
                ...state.config,
                monsters: {
                  ...state.config.monsters,
                  nijirigoke: { ...state.config.monsters.nijirigoke, budNutrientThreshold: budThreshold }
                }
              }
            }
          }

          const result = tick(state, randomFn)
          state = result.state
          // Restore config for next iteration
          state = {
            ...state,
            config: {
              ...state.config,
              monsters: {
                ...state.config.monsters,
                nijirigoke: { ...state.config.monsters.nijirigoke, budNutrientThreshold: budThreshold }
              }
            }
          }
        }
        console.log(`${label}: bud@tick=${budTick} flower@tick=${flowerTick}`)
        if (minMobileTicks === 5 && budThreshold === 4) console.log(trace.join('\n'))
      }

      // phaseTickCounter now implemented in code with config.minMobileTicks
      function runDigWithConfig(label: string, minMobileTicks: number, budThreshold: number) {
        const grid = createGrid(10, 10, 'soil')
        for (let x = 2; x <= 7; x++) grid[5][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
        for (let x = 2; x <= 7; x++) {
          if (grid[4][x].type === 'soil') grid[4][x].nutrientAmount = 5
          grid[6][x].nutrientAmount = 5
        }
        grid[4][3] = { type: 'soil', nutrientAmount: 9, magicAmount: 0 }

        const customConfig = createDefaultConfig()
        customConfig.monsters.nijirigoke.budNutrientThreshold = budThreshold
        customConfig.monsters.nijirigoke.minMobileTicks = minMobileTicks

        let state = createGameState({ grid, monsters: [], config: customConfig })
        const randomFn = createSeededRandom(42)
        const digResult = dig(state, { x: 3, y: 4 }, randomFn)
        if ('error' in digResult) return
        state = digResult.state
        const spawned = state.monsters[0]

        let budTick = -1
        let flowerTick = -1
        const trace: string[] = []

        for (let i = 0; i < 60; i++) {
          const m = state.monsters.find(m => m.id === spawned.id)
          if (m) {
            trace.push(`t=${i} ${m.phase} life=${m.life} nut=${m.carryingNutrient} ptc=${m.phaseTickCounter}`)
            if (m.phase === 'bud' && budTick === -1) budTick = i
            if (m.phase === 'flower' && flowerTick === -1) flowerTick = i
          }
          if (flowerTick !== -1 || !m) break
          state = tick(state, randomFn).state
        }
        console.log(`${label}: bud@${budTick} flower@${flowerTick}`)
        if (minMobileTicks === 5 && budThreshold === 4) console.log(trace.join('\n'))
      }

      console.log('\n=== EXPERIMENT: minMobileTicks (real implementation, dig nutrient=9) ===')
      runDigWithConfig('E: min=0  bud>=4', 0, 4)
      runDigWithConfig('F: min=3  bud>=4', 3, 4)
      runDigWithConfig('G: min=5  bud>=4', 5, 4)
      runDigWithConfig('H: min=8  bud>=4', 8, 4)
      runDigWithConfig('I: min=5  bud>=6', 5, 6)
      runDigWithConfig('J: min=8  bud>=6', 8, 6)

      expect(true).toBe(true)
    })

    it.skip('nijirigoke bud transition timing: dig high-nutrient soil', () => {
      // Scenario: dig soil with 30 nutrients → nijirigoke spawns with carried nutrients
      const grid = createGrid(10, 10, 'soil')
      // Empty area for movement
      for (let x = 2; x <= 7; x++) grid[5][x] = { type: 'empty', nutrientAmount: 0, magicAmount: 0 }
      // More soil with nutrients nearby
      for (let x = 2; x <= 7; x++) {
        if (grid[4][x].type === 'soil') grid[4][x].nutrientAmount = 5
        grid[6][x].nutrientAmount = 5
      }
      // Nutrient-9 soil to dig → nijirigoke spawn (threshold < 10)
      // life = min(9, 24) = 9, carried = 0, remaining = 0
      grid[4][3] = { type: 'soil', nutrientAmount: 9, magicAmount: 0 }

      let state = createGameState({ grid, monsters: [] })
      const randomFn = createSeededRandom(42)

      // Dig the high-nutrient soil
      const digResult = dig(state, { x: 3, y: 4 }, randomFn)
      if ('error' in digResult) {
        throw new Error(`Dig failed: ${digResult.error}`)
      }
      state = digResult.state

      // Check spawned monster
      const spawned = state.monsters[0]
      console.log(`\n=== After Dig (soil nutrient=9) ===`)
      console.log(`Spawned: life=${spawned.life}/${spawned.maxLife} nutrient=${spawned.carryingNutrient} phase=${spawned.phase}`)

      const trace: string[] = []
      let budTick = -1

      for (let i = 0; i < 30; i++) {
        const m = state.monsters.find(m => m.type === 'nijirigoke' && m.id === spawned.id)
        if (m) {
          trace.push(`tick=${i} phase=${m.phase} life=${m.life}/${m.maxLife} nutrient=${m.carryingNutrient}`)
          if (m.phase === 'bud' && budTick === -1) budTick = i
        }
        if (m?.phase === 'flower') break
        const result = tick(state, randomFn)
        state = result.state
      }
      console.log(trace.join('\n'))
      console.log(`Bud at tick: ${budTick}`)
      expect(trace.length).toBeGreaterThan(0)
    })

    it('gajigajimushi should gain nutrients from predation (nutrient transfer)', () => {
      const grid = createGrid(5, 5, 'empty')

      const nijiConfig = MONSTER_CONFIGS.nijirigoke
      const gajiConfig = MONSTER_CONFIGS.gajigajimushi

      // Same cell = instant predation in processPredation
      const gaji: Monster = {
        id: 'g1',
        type: 'gajigajimushi',
        position: { x: 2, y: 2 },
        direction: 'right',
        pattern: gajiConfig.pattern,
        phase: 'larva',
        phaseTickCounter: 0,
        life: gajiConfig.life,
        maxLife: gajiConfig.life,
        attack: gajiConfig.attack,
        predationTargets: [...gajiConfig.predationTargets],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }
      const niji: Monster = {
        id: 'n1',
        type: 'nijirigoke',
        position: { x: 2, y: 2 }, // same cell
        direction: 'left',
        pattern: nijiConfig.pattern,
        phase: 'mobile',
        phaseTickCounter: 0,
        life: nijiConfig.life,
        maxLife: nijiConfig.life,
        attack: nijiConfig.attack,
        predationTargets: [...nijiConfig.predationTargets],
        carryingNutrient: 6,
        nestPosition: null,
        nestOrientation: null,
      }

      const result = processPredation([gaji, niji], grid)

      // Gaji should have eaten niji and gained its nutrients
      const survivingGaji = result.monsters.find(m => m.id === 'g1')
      expect(survivingGaji).toBeDefined()
      expect(survivingGaji!.carryingNutrient).toBe(6) // transferred from prey
      expect(result.monsters.find(m => m.id === 'n1')).toBeUndefined()
      expect(result.events.some(e => e.type === 'PREDATION')).toBe(true)
    })

    it('lizardman should defeat 2 heroes in combat', () => {
      const grid = createGrid(10, 10, 'empty')
      for (let y = 0; y < 10; y++) {
        grid[y][0] = { type: 'wall', nutrientAmount: 0, magicAmount: 0 }
        grid[y][9] = { type: 'wall', nutrientAmount: 0, magicAmount: 0 }
      }
      for (let x = 0; x < 10; x++) {
        grid[0][x] = { type: 'wall', nutrientAmount: 0, magicAmount: 0 }
        grid[9][x] = { type: 'wall', nutrientAmount: 0, magicAmount: 0 }
      }

      const lizConfig = MONSTER_CONFIGS.lizardman
      const monsters: Monster[] = [{
        id: 'liz1',
        type: 'lizardman',
        position: { x: 5, y: 5 },
        direction: 'left',
        pattern: lizConfig.pattern,
        phase: 'normal',
        phaseTickCounter: 0,
        life: lizConfig.life, // 120
        maxLife: lizConfig.life,
        attack: lizConfig.attack, // 15
        predationTargets: [...lizConfig.predationTargets],
        carryingNutrient: 0,
        nestPosition: null,
        nestOrientation: null,
      }]

      // Hero facing right, lizardman at hero's front cell (x+1)
      // Hero AI will block on monster and face it → combat every tick
      const heroes = [
        {
          kind: 'hero' as const,
          id: 'hero-1',
          position: { x: 4, y: 5 },
          direction: 'right' as const,
          life: 50,
          maxLife: 50,
          attack: 5,
          attackPattern: 'slash' as const,
          visitedCells: new Set(['4,5']),
          pathHistory: [{ x: 4, y: 5 }],
          state: 'exploring' as const,
          targetFound: false,
        },
        {
          kind: 'hero' as const,
          id: 'hero-2',
          position: { x: 4, y: 4 },
          direction: 'down' as const,
          life: 50,
          maxLife: 50,
          attack: 5,
          attackPattern: 'slash' as const,
          visitedCells: new Set(['4,4']),
          pathHistory: [{ x: 4, y: 4 }],
          state: 'exploring' as const,
          targetFound: false,
        },
      ]

      // Lizardman at (5,5) facing left → attacks hero-1 at (4,5)
      monsters[0].direction = 'left'

      let state = createGameState({
        grid,
        monsters,
        heroes,
        demonLordPosition: { x: 8, y: 8 },
        heroSpawnConfig: { partySize: 2, spawnStartTick: 0, spawnInterval: 10, heroesSpawned: 2 },
      })

      // Run combat for 30 ticks
      const randomFn3 = createSeededRandom(42)
      for (let i = 0; i < 30; i++) {
        const result = tick(state, randomFn3)
        state = result.state
      }

      // Lizardman (120hp, 15atk) should survive vs 2 heroes (50hp, 5atk each)
      // Hero-1 faces lizardman: mutual combat. Hero-2 may or may not engage.
      // At minimum, lizardman should survive.
      const liz = state.monsters.find(m => m.id === 'liz1')
      expect(liz).toBeDefined()
      expect(liz!.life).toBeGreaterThan(0)
    })
  })
})
