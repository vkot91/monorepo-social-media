import type { ApiEnv } from "@social/env";

export const testApiEnv = {
  NODE_ENV: "test",
  PORT: 3210,
  DATABASE_URL: "postgresql://social_media_test:social_media_test_password@127.0.0.1:55432/social_media_test",
  REDIS_URL: "redis://localhost:56380",
  JWT_ACCESS_SECRET: "test-access-secret-at-least-32-chars",
  JWT_REFRESH_SECRET: "test-refresh-secret-at-least-32-chars",
  JWT_ACCESS_EXPIRES_IN: "15m",
  JWT_REFRESH_EXPIRES_IN: "30d",
  CORS_ORIGIN: "http://127.0.0.1:3100",
  MAIL_FROM: "Social Media Test <no-reply@example.com>",
  SMTP_HOST: undefined,
  SMTP_PORT: 587,
  SMTP_SECURE: false,
  SMTP_USER: undefined,
  SMTP_PASSWORD: undefined,
} satisfies ApiEnv;

export const createTestApiEnv = (overrides: Partial<ApiEnv> = {}): ApiEnv => ({
  ...testApiEnv,
  ...overrides,
});
