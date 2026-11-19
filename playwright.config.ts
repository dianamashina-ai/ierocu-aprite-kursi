import { defineConfig, devices } from "@playwright/test";

/**
 * E2E testi. Pirms palaišanas: `npm run build` un sēklota datubāze (DATABASE_URL).
 * Serveris tiek palaists automātiski uz 3100. porta.
 */
export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  expect: { timeout: 10_000 },
  use: { baseURL: "http://localhost:3100", trace: "off" },
  projects: [
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "npx next start -p 3100",
    env: {
      BETTER_AUTH_URL: "http://localhost:3100",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3100",
      DEV_OUTBOX: "1",
      AUTH_RATE_LIMIT: "off",
      PAYMENT_PROVIDER: "dev",
      ALLOW_TEST_PAYMENTS: "1",
    },
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
