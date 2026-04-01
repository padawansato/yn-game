import { test, expect } from '@playwright/test'
import { GamePage } from './helpers/game-page'

test.describe('Hero System E2E Tests', () => {
  let game: GamePage

  test.beforeEach(async ({ page }) => {
    game = new GamePage(page)
    await game.goto()
    await game.waitForLoad()
  })

  test('Demon lord placement via summon button', async () => {
    // Click "勇者を呼ぶ" button
    await game.summonHeroButton().click()

    // Placement banner should appear
    await expect(game.placementBanner()).toBeVisible()

    // Dig a cell first to create an empty space, then place demon lord
    // Entry point (5,1) is already empty
    await game.clickCell(5, 1)

    // Demon lord cell should appear
    await expect(game.demonLordCell()).toBeVisible()
    // Placement banner should disappear
    await expect(game.placementBanner()).not.toBeVisible()
  })

  test('Heroes spawn after demon lord placement', async () => {
    // Setup: place demon lord
    await game.summonHeroButton().click()
    await game.clickCell(5, 1)

    // No heroes yet at tick 0 after placement
    expect(await game.heroes().count()).toBe(0)

    // Advance ticks - heroes spawn at spawnStartTick (set to currentTime on placement)
    // With spawnInterval=10, first hero spawns immediately after placement tick
    await game.advanceTicks(2)

    // At least one hero should have spawned
    await expect(game.heroes().first()).toBeVisible()

    // Hero status should show info
    await expect(game.heroStatus()).toBeVisible()
  })

  test('Combat event appears in event log', async () => {
    // Use "捕食チェーン" scenario which has monsters, then add heroes
    await game.runScenario('捕食チェーン')

    // Place demon lord via summon
    await game.summonHeroButton().click()
    // Find an empty cell for demon lord - dig first if needed
    await game.clickCell(5, 1)

    // Advance many ticks for hero to encounter monsters
    await game.advanceTicks(30)

    // Check event log for combat-related events
    const eventTexts = await game.getEventTexts()
    const hasCombatEvent = eventTexts.some(
      (text) => text.includes('HERO_COMBAT') || text.includes('HERO_DIED') || text.includes('MONSTER_DIED'),
    )

    // Combat should have occurred (monsters are nearby)
    expect(hasCombatEvent).toBe(true)
  })

  test('Game over when hero escapes', async () => {
    // Create a minimal scenario: demon lord near entrance so hero finds it quickly
    // Use default grid, place demon lord at (5,2) - close to entrance (5,0)
    // First dig path from entrance to demon lord
    await game.clickCell(5, 2)
    await game.clickCell(5, 3)

    // Summon hero and place demon lord close to entrance
    await game.summonHeroButton().click()
    await game.clickCell(5, 2)

    // Advance many ticks: hero spawns → explores → finds demon lord → returns → game over
    // Hero path: (5,0) → (5,1) → (5,2) demon lord found → return → (5,1) → (5,0) escape
    await game.advanceTicks(50)

    // Game over banner should appear
    await expect(game.gameOverBanner()).toBeVisible({ timeout: 5000 })
  })

  test('Heroes are immune to pickaxe', async () => {
    // Setup: place demon lord and wait for hero spawn
    await game.summonHeroButton().click()
    await game.clickCell(5, 1)
    await game.advanceTicks(2)

    // Wait for hero to appear
    await expect(game.heroes().first()).toBeVisible()

    // Get hero HP before click
    const hpBefore = await game.getHeroHP()
    expect(hpBefore.length).toBeGreaterThan(0)

    // Click on a hero cell (pickaxe attack)
    const heroCell = game.heroes().first()
    await heroCell.click()

    // Hero HP should remain unchanged
    const hpAfter = await game.getHeroHP()
    expect(hpAfter[0].life).toBe(hpBefore[0].life)
  })
})
