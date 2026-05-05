import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { parseApiEnv, parseDatabaseEnv, parseWebEnv } from "./index";

const validSecret = "a".repeat(32);

describe("parseApiEnv", () => {
  it("parses required API environment variables and applies defaults", () => {
    const env = parseApiEnv({
      DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
      JWT_ACCESS_SECRET: validSecret,
      JWT_REFRESH_SECRET: validSecret,
    });

    expect(env).toMatchObject({
      NODE_ENV: "development",
      PORT: 3001,
      CORS_ORIGIN: "http://localhost:3000",
      REDIS_URL: "redis://localhost:6380",
    });
  });

  it("rejects short JWT secrets", () => {
    expect(() =>
      parseApiEnv({
        DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
        JWT_ACCESS_SECRET: "short",
        JWT_REFRESH_SECRET: validSecret,
      }),
    ).toThrow(ZodError);
  });

  it("treats an empty PORT value as unset", () => {
    const env = parseApiEnv({
      PORT: "",
      DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
      JWT_ACCESS_SECRET: validSecret,
      JWT_REFRESH_SECRET: validSecret,
    });

    expect(env.PORT).toBe(3001);
  });
});

describe("parseWebEnv", () => {
  it("parses web environment variables and applies defaults", () => {
    expect(parseWebEnv({})).toEqual({
      NODE_ENV: "development",
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
    });
  });
});

describe("parseDatabaseEnv", () => {
  it("parses database environment variables", () => {
    expect(
      parseDatabaseEnv({
        DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
      }),
    ).toEqual({
      NODE_ENV: "development",
      DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    });
  });
});
