import { defineConfig, devices } from '@playwright/test';

// E2E for the auth flow — runs the backend with AUTH_ENABLED=true. Kept in a
// separate config since auth is a server-wide flag (the main suite runs auth off).
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/auth.spec.js',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'npm --prefix ../backend run e2e:server',
      url: 'http://localhost:3001/health',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { E2E_AUTH: 'true' }
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
