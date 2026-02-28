import { defineConfig, devices } from '@playwright/test'

/**
 * MonCastle E2E Test Configuration
 * ===============================================================
 * Two test projects:
 *   browser — UI/game tests hitting the Vite dev server (localhost:5173)
 *   api     — Direct API tests hitting the Express backend (localhost:3001)
 *
 * Usage:
 *   npx playwright test                     # all tests
 *   npx playwright test --project=browser   # UI only
 *   npx playwright test --project=api       # backend API only
 *   npx playwright test 01-api              # single file
 */

export default defineConfig({
  testDir: './e2e',
  // Allow each test file 60 s, each test 30 s
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Do not retry on CI — fail fast
  retries: 0,
  // Parallelism: run files in parallel but tests within a file are sequential
  workers: 2,
  // Concise reporter
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

  use: {
    // Capture trace on first retry (useful for debugging)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // All browser tests hit the Vite dev server
    baseURL: 'http://localhost:5173',
    // Don't slow down interactions
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },

  projects: [
    {
      // ── Browser tests (01, 02, 03) ───────────────────────────────────────
      name: 'browser',
      testMatch: /0[123]-.*\.spec\.js$/,
      use: {
        ...devices['Desktop Chrome'],
        // Demo mode must be set so wallet auto-connects and canvas loads
        baseURL: 'http://localhost:5173',
      },
    },
    {
      // ── Direct API tests (04) ────────────────────────────────────────────
      name: 'api',
      testMatch: /04-.*\.spec\.js$/,
      use: {
        // No browser needed — Playwright request fixture connects directly
        baseURL: 'http://localhost:3001',
      },
    },
  ],

  // ── Web server — start Vite in demo mode for browser tests ───────────────
  // The backend must already be running separately:  node src/index.js
  webServer: {
    command: 'npx vite --port 5173 --mode demo',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
    env: {
      VITE_MODE: 'demo',
    },
  },
})
