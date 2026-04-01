import type { Page, Locator } from '@playwright/test'

export class GamePage {
  constructor(private page: Page) {}

  // --- Navigation ---

  async goto() {
    await this.page.goto('/yn-game/')
  }

  async waitForLoad() {
    await this.page.waitForSelector('.debug-ui')
  }

  // --- Grid ---

  get grid(): Locator {
    return this.page.locator('.grid')
  }

  cell(x: number, y: number): Locator {
    return this.page.locator(`[title^="(${x},${y})"]`)
  }

  soilCells(): Locator {
    return this.grid.locator('.cell-soil')
  }

  emptyCells(): Locator {
    return this.grid.locator('.cell-empty')
  }

  entranceCell(): Locator {
    return this.grid.locator('.entrance-cell')
  }

  demonLordCell(): Locator {
    return this.grid.locator('.demon-lord-cell')
  }

  // --- Monsters ---

  nijirigoke(): Locator {
    return this.grid.locator('.monster-nijirigoke')
  }

  nijirigokeBud(): Locator {
    return this.grid.locator('.nijirigoke-bud')
  }

  nijirigokeFlower(): Locator {
    return this.grid.locator('.nijirigoke-flower')
  }

  nijirigokeWithered(): Locator {
    return this.grid.locator('.nijirigoke-withered')
  }

  gajigajimushi(): Locator {
    return this.grid.locator('.monster-gajigajimushi')
  }

  lizardman(): Locator {
    return this.grid.locator('.monster-lizardman')
  }

  allMonsters(): Locator {
    return this.grid.locator(
      '.monster-nijirigoke, .nijirigoke-bud, .nijirigoke-flower, .nijirigoke-withered, .monster-gajigajimushi, .monster-lizardman',
    )
  }

  // --- Heroes ---

  heroes(): Locator {
    return this.grid.locator('.hero-cell')
  }

  returningHeroes(): Locator {
    return this.grid.locator('.hero-cell.hero-returning')
  }

  // --- Controls ---

  tickButton(): Locator {
    return this.page.locator('.controls button', { hasText: 'Tick' })
  }

  startButton(): Locator {
    return this.page.locator('.controls button', { hasText: 'Start' })
  }

  resetButton(): Locator {
    return this.page.locator('.controls button', { hasText: 'Reset' })
  }

  summonHeroButton(): Locator {
    return this.page.locator('.summon-hero-btn')
  }

  scenarioButton(name: string): Locator {
    return this.page.locator('.scenario-btn', { hasText: name })
  }

  // --- Status ---

  statusRow(): Locator {
    return this.page.locator('.status-row')
  }

  heroStatus(): Locator {
    return this.page.locator('.hero-status')
  }

  heroBadge(): Locator {
    return this.page.locator('.hero-badge')
  }

  gameOverBanner(): Locator {
    return this.page.locator('.game-over-banner')
  }

  placementBanner(): Locator {
    return this.page.locator('.placement-banner')
  }

  // --- Events ---

  events(): Locator {
    return this.page.locator('.event')
  }

  eventList(): Locator {
    return this.page.locator('.event-list')
  }

  // --- Actions ---

  async clickCell(x: number, y: number) {
    await this.cell(x, y).click()
  }

  async advanceTicks(n: number) {
    for (let i = 0; i < n; i++) {
      await this.tickButton().click()
      await this.page.waitForTimeout(30)
    }
  }

  async runScenario(name: string) {
    await this.scenarioButton(name).click()
  }

  // --- Inspection ---

  async getCellNutrient(x: number, y: number): Promise<number> {
    const title = await this.cell(x, y).getAttribute('title')
    const match = title?.match(/養分:(\d+)/)
    return match ? parseInt(match[1], 10) : 0
  }

  async getCellContent(x: number, y: number): Promise<string> {
    return (await this.cell(x, y).locator('.cell-content').textContent()) ?? ''
  }

  async getEventTexts(): Promise<string[]> {
    const count = await this.events().count()
    const texts: string[] = []
    for (let i = 0; i < count; i++) {
      texts.push((await this.events().nth(i).textContent()) ?? '')
    }
    return texts
  }

  async getHeroHP(): Promise<{ id: string; life: number; maxLife: number }[]> {
    const badges = await this.heroBadge().allTextContents()
    return badges.map((text) => {
      const match = text.match(/(\S+)\s*\(HP:(\d+)\/(\d+)/)
      return {
        id: match?.[1] ?? '',
        life: parseInt(match?.[2] ?? '0', 10),
        maxLife: parseInt(match?.[3] ?? '0', 10),
      }
    })
  }
}
