import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3100);
const apiPort = Number(process.env.PLAYWRIGHT_API_PORT ?? 3210);
const baseURL = `http://127.0.0.1:${port}`;
const apiURL = `http://127.0.0.1:${apiPort}`;

export default defineConfig({
  expect: { timeout: 10_000 },
  forbidOnly: Boolean(process.env.CI),
  outputDir: "test-results",
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  retries: process.env.CI ? 2 : 0,
  testDir: "./e2e",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  workers: 1,
  webServer: [
    {
      command:
        "pnpm --filter @social/database build && pnpm --filter @social/api build && pnpm --filter @social/api start",
      env: {
        NODE_ENV: "test",
        PORT: String(apiPort),
        CORS_ORIGIN: baseURL,
        DATABASE_URL:
          process.env.DATABASE_URL ??
          "postgresql://social_media_test:social_media_test_password@127.0.0.1:55432/social_media_test",
        REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:56380",
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? "test-access-secret-at-least-32-chars",
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-at-least-32-chars",
        MAIL_FROM: "Social Media Test <no-reply@example.com>",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: `${apiURL}/health`,
      stdout: "pipe",
      stderr: "pipe",
    },
    {
      command: `pnpm --filter @social/web exec next dev --hostname 127.0.0.1 --port ${port}`,
      env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_API_URL: apiURL,
        NEXT_TELEMETRY_DISABLED: "1",
      },
      reuseExistingServer: false,
      timeout: 120_000,
      url: baseURL,
    },
  ],
});
