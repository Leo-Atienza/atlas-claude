// playwright.config.ts — ATLAS v9 C3+C4 (Wave 5). E2E + a11y + visual regression.
// VR baselines are Linux/CI-only — NEVER commit local Windows renders (font
// antialiasing differs). Playwright 1.61.x. Tag @visual / @a11y to filter.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  // deterministic screenshots
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    // dark-mode visual project
    { name: 'dark', use: { ...devices['Desktop Chrome'], colorScheme: 'dark' } },
  ],
  webServer: process.env.CI ? { command: 'npm run start', url: 'http://localhost:3000', reuseExistingServer: false } : undefined,
});
