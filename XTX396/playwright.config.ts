/**
 * Playwright Configuration
 *
 * Configuration for preview video generation.
 * Note: This is NOT for e2e testing, but for video recording.
 */

import { defineConfig } from '@playwright/test'

export default defineConfig({
  // Preview recording settings
  use: {
    // Browser settings
    channel: 'chromium',
    headless: true,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    
    // Video recording
    video: {
      mode: 'on',
      size: { width: 1280, height: 720 },
    },
    
    // Screenshots  
    screenshot: 'on',
    
    // Disable animations for deterministic recording
    // (We handle our own smooth scrolling)
    launchOptions: {
      args: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    },
  },
  
  // Output directories
  outputDir: 'public/previews',
  
  // Timeout for preview generation
  timeout: 60000, // 1 minute per scene
  
  // Parallelization (disabled for sequential recording)
  workers: 1,
  fullyParallel: false,
  
  // Reporter
  reporter: [
    ['list'],
    ['html', { outputFolder: 'preview-report', open: 'never' }],
  ],
  
  // Projects (can be extended for mobile viewports)
  projects: [
    {
      name: 'desktop',
      use: {
        viewport: { width: 1280, height: 720 },
      },
    },
    {
      name: 'mobile',
      use: {
        viewport: { width: 375, height: 812 },
        isMobile: true,
        deviceScaleFactor: 2,
      },
    },
  ],
})
