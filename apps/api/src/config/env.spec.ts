import { parseApiEnv } from "@social/env";

import { env } from "./env";

jest.mock("@social/env", () => ({
  parseApiEnv: jest.fn(() => ({
    NODE_ENV: "test",
    PORT: 3001,
    DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    REDIS_URL: "redis://localhost:6380",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "30d",
    CORS_ORIGIN: "http://localhost:3000",
    MAIL_FROM: "Social Media <no-reply@example.com>",
    SMTP_HOST: undefined,
    SMTP_PASSWORD: undefined,
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_USER: undefined,
  })),
}));

describe("env", () => {
  it("exports the parsed API environment", () => {
    expect(env).toMatchObject({
      NODE_ENV: "test",
      PORT: 3001,
      CORS_ORIGIN: "http://localhost:3000",
    });
  });

  it("parses the API environment when the module loads", () => {
    expect(parseApiEnv).toHaveBeenCalledTimes(1);
    expect(parseApiEnv).toHaveBeenCalledWith();
  });
});
