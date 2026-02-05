import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    // Use Docker service name when running in container, localhost otherwise
    baseURL: process.env.CI ? 'http://app:5173' : 'http://localhost:5173',
    trace: 'on-first-retry',
    headless: true,
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        },
      },
    },
  ],
})
