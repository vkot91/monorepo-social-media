import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 3210);
const baseURL = `http://127.0.0.1:${port}`;
const apiURL = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  expect: {
    timeout: 10_000,
  },
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "npx tsx e2e/mock-api.ts",
      env: {
        PLAYWRIGHT_API_PORT: String(apiPort),
      },
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
      url: `${apiURL}/health`,
    },
    {
      command: `pnpm dev --hostname 127.0.0.1 --port ${port}`,
      env: {
        NEXT_PUBLIC_API_URL: apiURL,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      url: baseURL,
    },
  ],
});
