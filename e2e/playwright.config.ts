import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html']],
  retries: process.env.CI ? 1 : 0,
  fullyParallel: false,
  // Jede Spec erzeugt ihre eigenen eindeutigen Sites (SiteHelper) und räumt sie im
  // teardown ab → Specs sind untereinander isoliert und laufen auch parallel sicher.
  workers: process.env.CI ? 4 : 2,
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Erlaubt eigene Test-Hosts (*.e2e.local) für isoliertes Tracking ohne DNS.
    launchOptions: {
      args: ['--host-resolver-rules=MAP *.e2e.local 127.0.0.1'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } },
      testIgnore: /mobile\.spec\.ts/,
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
  ],
})
