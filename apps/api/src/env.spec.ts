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
  })),
}));

jest.mock("node:fs", () => ({
  existsSync: jest.fn(() => false),
  readFileSync: jest.fn(),
}));

import { getApiEnv } from "./env";

describe("getApiEnv", () => {
  it("returns the parsed API environment", () => {
    expect(getApiEnv()).toMatchObject({
      NODE_ENV: "test",
      PORT: 3001,
      CORS_ORIGIN: "http://localhost:3000",
    });
  });
});
