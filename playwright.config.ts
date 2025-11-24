import { defineConfig } from '@playwright/test'
export default defineConfig({
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  testDir: 'tests/e2e'
})
