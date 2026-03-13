/**
 * Playwright E2E Test Configuration
 *
 * Separate from playwright.config.ts (preview video generation).
 * Run with: npx playwright test --config=playwright-e2e.config.ts
 */

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e-results',
  timeout: 30000,

  expect: {
    timeout: 5000,
  },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e-report', open: 'never' }],
  ],

  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      use: { ...devices['iPhone 14'] },
    },
  ],
})
