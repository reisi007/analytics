import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  reporter: 'list',
  retries: process.env.CI ? 2 : 0,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:8081',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
