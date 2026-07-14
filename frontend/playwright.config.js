import { defineConfig, devices } from '@playwright/test';

// End-to-end tests drive the real app: an ephemeral-MongoDB backend on :3001
// and the Vite dev server on :5173 (pointed at that backend via VITE_API_URL).
// Chromium is pre-installed in this environment; no browser download needed.
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.js',
  testIgnore: '**/auth.spec.js', // auth flow runs under playwright.auth.config.js
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ],
  webServer: [
    {
      command: 'npm --prefix ../backend run e2e:server',
      url: 'http://localhost:3001/health',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { VITE_API_URL: 'http://localhost:3001/api' }
    }
  ]
});
