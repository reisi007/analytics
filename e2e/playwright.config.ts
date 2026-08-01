import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html']],
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  // Alle Specs teilen sich einen Stack (DB/Image) — serielle Ausführung hält die Zähler deterministisch.
  workers: 1,
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
