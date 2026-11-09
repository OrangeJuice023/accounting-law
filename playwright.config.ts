import { defineConfig, devices } from '@playwright/test';

/**
 * Regression suite runs against the PRODUCTION build (dist/) served with SPA
 * fallback, mirroring Cloudflare Pages. Build first: npm run build.
 * Against live production: LIVE_URL=https://<host> npx playwright test
 * (webServer is skipped when LIVE_URL is set).
 */
const LIVE_URL = process.env.LIVE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  // Live runs tolerate edge-network flakiness; local runs stay strict.
  retries: LIVE_URL ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: LIVE_URL ?? 'http://localhost:4174',
    trace: 'retain-on-failure',
  },
  webServer: LIVE_URL
    ? undefined
    : {
        command: 'node scripts/serve-spa.mjs dist 4174',
        url: 'http://localhost:4174',
        reuseExistingServer: false,
        timeout: 30000,
      },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
