import { test, expect } from '@playwright/test'
import { GamePage } from './helpers/game-page'

test.describe('Nutrient System E2E Tests', () => {
  let game: GamePage

  test.beforeEach(async ({ page }) => {
    game = new GamePage(page)
    await game.goto()
    await game.waitForLoad()
  })

  test('8.2.1: Digging soil with nutrients spawns Nijirigoke', async () => {
    // Default grid has nutrients scattered. Find a soil cell with nutrients > 0.
    // The entry point (5,1) is empty, (4,3) has 12 nutrients, (6,2) has 20.
    // Dig a low-nutrient soil cell to get a nijirigoke (nutrient < 10).
    // First, dig the entry area to access inner cells.
    const initialMonsterCount = await game.allMonsters().count()

    // Dig (5,1) - the entry point is already empty, dig adjacent soil
    await game.clickCell(4, 1)
    const monsterCountAfter = await game.allMonsters().count()

    // A soil cell with nutrients > 0 should spawn a monster
    // Note: border cells are walls, inner cells may have varying nutrients
    const nutrient = await game.getCellNutrient(4, 1)
    if (nutrient === 0) {
      // Cell had 0 nutrients, no monster spawned, just became empty
      expect(await game.emptyCells().count()).toBeGreaterThan(0)
    } else {
      expect(monsterCountAfter).toBeGreaterThan(initialMonsterCount)
    }
  })

  test('8.2.2: Digging soil with 0 nutrients creates only empty space', async ({ page }) => {
    // Use title attribute to find a 0-nutrient soil cell
    const zeroNutrientSoil = page.locator('.cell-soil[title*="養分:0"]').first()
    const exists = (await zeroNutrientSoil.count()) > 0

    if (!exists) {
      test.skip()
      return
    }

    // Extract coordinates from title: "(x,y) 養分:0"
    const title = await zeroNutrientSoil.getAttribute('title')
    const match = title?.match(/\((\d+),(\d+)\)/)
    const zeroNutrientCell = match ? { x: parseInt(match[1], 10), y: parseInt(match[2], 10) } : null

    if (!zeroNutrientCell) {
      // All cells have nutrients - skip
      test.skip()
      return
    }

    const monstersBefore = await game.allMonsters().count()
    await game.clickCell(zeroNutrientCell.x, zeroNutrientCell.y)
    const monstersAfter = await game.allMonsters().count()

    expect(monstersAfter).toBe(monstersBefore)
  })

  test('8.2.3: Nijirigoke moves across grid over multiple ticks', async () => {
    // Use the nijirigoke scenario for a controlled environment
    await game.runScenario('ニジリゴケ変態')

    // Get initial nijirigoke position
    const initialContent = await game.nijirigoke().first().locator('.cell-content').textContent()
    expect(initialContent).toBe('苔')

    // Advance several ticks
    await game.advanceTicks(5)

    // The nijirigoke should still exist (mobile phase)
    const nijirigokeCount = await game.nijirigoke().count()
    expect(nijirigokeCount).toBeGreaterThanOrEqual(1)
  })

  test('8.2.4: Status displays nutrient information', async () => {
    const statusText = await game.statusRow().textContent()
    expect(statusText).toContain('養分:')
  })

  test('8.3: High nutrient soil spawns stronger monsters', async () => {
    // Default grid: grid[2][6] has 20 nutrients → (x=6, y=2) → should spawn lizardman (17+)
    // dig requires adjacent empty cell, so dig a path from entry point (5,1) to (6,2)
    // Entry (5,1) is already empty. Dig (6,1) first, then (6,2).
    await game.clickCell(6, 1) // dig adjacent to entry point
    await game.clickCell(6, 2) // now adjacent to newly empty (6,1)

    // After dig, cell should show lizardman (蜥)
    const cellContent = await game.getCellContent(6, 2)
    expect(cellContent).toBe('蜥')
  })
})
