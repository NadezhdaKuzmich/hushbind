import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const isCI = Boolean(process.env.CI)

/**
 * E2E runs against the production build (`vite preview`), not the dev server:
 * that is where the CSP meta tag and the real bundles exist.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : 'list',
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${String(PORT)} --strictPort`,
    port: PORT,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
})
