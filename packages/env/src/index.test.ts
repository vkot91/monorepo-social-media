import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { parseApiEnv, parseDatabaseEnv, parseWebEnv } from "./index";

const validSecret = "a".repeat(32);
const nodeEnvironments = ["development", "test", "production"] as const;
const validApiEnv = {
  DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
  JWT_ACCESS_SECRET: validSecret,
  JWT_REFRESH_SECRET: validSecret,
  SMTP_HOST: "smtp.example.com",
  SMTP_PASSWORD: "secret",
  SMTP_USER: "mailer",
};

describe("parseApiEnv", () => {
  it("parses required API environment variables and applies defaults", () => {
    const env = parseApiEnv(validApiEnv);

    expect(env).toMatchObject({
      NODE_ENV: "development",
      PORT: 3001,
      CORS_ORIGIN: "http://localhost:3000",
      MAIL_FROM: "Social Media <no-reply@example.com>",
      REDIS_URL: "redis://localhost:6380",
      SMTP_PORT: 465,
      SMTP_SECURE: false,
      SMTP_USER: "mailer",
      SMTP_PASSWORD: "secret",
      SMTP_HOST: "smtp.example.com",
    });
  });

  it("rejects short JWT secrets", () => {
    expect(() =>
      parseApiEnv({
        ...validApiEnv,
        JWT_ACCESS_SECRET: "short",
      }),
    ).toThrow(ZodError);
  });

  it.each(nodeEnvironments)("accepts NODE_ENV=%s", (nodeEnv) => {
    const env = parseApiEnv({
      ...validApiEnv,
      NODE_ENV: nodeEnv,
    });

    expect(env.NODE_ENV).toBe(nodeEnv);
  });

  it("rejects unsupported NODE_ENV values", () => {
    expect(() =>
      parseApiEnv({
        ...validApiEnv,
        NODE_ENV: "staging",
      }),
    ).toThrow(ZodError);
  });

  it("parses a test API environment", () => {
    const env = parseApiEnv({
      ...validApiEnv,
      CORS_ORIGIN: "http://127.0.0.1:3100",
      DATABASE_URL: "postgresql://social_media_test:social_media_test_password@127.0.0.1:55432/social_media_test",
      NODE_ENV: "test",
      PORT: "3210",
      REDIS_URL: "redis://localhost:56380",
    });

    expect(env).toMatchObject({
      CORS_ORIGIN: "http://127.0.0.1:3100",
      DATABASE_URL: "postgresql://social_media_test:social_media_test_password@127.0.0.1:55432/social_media_test",
      NODE_ENV: "test",
      PORT: 3210,
      REDIS_URL: "redis://localhost:56380",
    });
  });

  it("treats an empty PORT value as unset", () => {
    const env = parseApiEnv({
      ...validApiEnv,
      PORT: "",
    });

    expect(env.PORT).toBe(3001);
  });

  it.each([
    ["DATABASE_URL", "not-a-url"],
    ["REDIS_URL", "not-a-url"],
    ["CORS_ORIGIN", "not-a-url"],
  ])("rejects invalid %s values", (key, value) => {
    expect(() =>
      parseApiEnv({
        ...validApiEnv,
        [key]: value,
      }),
    ).toThrow(ZodError);
  });

  it.each([
    ["PORT", "0"],
    ["PORT", "-1"],
    ["SMTP_PORT", "0"],
    ["SMTP_PORT", "-1"],
  ])("rejects invalid positive integer %s values", (key, value) => {
    expect(() =>
      parseApiEnv({
        ...validApiEnv,
        [key]: value,
      }),
    ).toThrow(ZodError);
  });

  it("parses SMTP settings", () => {
    const env = parseApiEnv({
      ...validApiEnv,
      SMTP_HOST: "smtp.example.com",
      SMTP_PASSWORD: "secret",
      SMTP_PORT: "465",
      SMTP_SECURE: "true",
      SMTP_USER: "mailer",
    });

    expect(env).toMatchObject({
      SMTP_HOST: "smtp.example.com",
      SMTP_PASSWORD: "secret",
      SMTP_PORT: 465,
      SMTP_SECURE: true,
      SMTP_USER: "mailer",
    });
  });

  it("parses false SMTP secure values", () => {
    const env = parseApiEnv({
      ...validApiEnv,
      SMTP_SECURE: "false",
    });

    expect(env.SMTP_SECURE).toBe(false);
  });

  it("rejects invalid SMTP secure values", () => {
    expect(() =>
      parseApiEnv({
        ...validApiEnv,
        SMTP_SECURE: "yes",
      }),
    ).toThrow(ZodError);
  });

  it("treats empty optional SMTP values as unset", () => {
    const env = parseApiEnv({
      ...validApiEnv,
      SMTP_HOST: "",
      SMTP_PASSWORD: "",
      SMTP_USER: "",
    });

    expect(env.SMTP_HOST).toBeUndefined();
    expect(env.SMTP_PASSWORD).toBeUndefined();
    expect(env.SMTP_USER).toBeUndefined();
  });
});

describe("parseWebEnv", () => {
  it("parses web environment variables and applies defaults", () => {
    expect(parseWebEnv({})).toEqual({
      NODE_ENV: "development",
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
    });
  });

  it.each(nodeEnvironments)("accepts NODE_ENV=%s", (nodeEnv) => {
    expect(
      parseWebEnv({
        NODE_ENV: nodeEnv,
      }),
    ).toEqual({
      NODE_ENV: nodeEnv,
      NEXT_PUBLIC_API_URL: "http://localhost:3001",
    });
  });

  it("parses a test web environment", () => {
    expect(
      parseWebEnv({
        NEXT_PUBLIC_API_URL: "http://127.0.0.1:3210",
        NODE_ENV: "test",
      }),
    ).toEqual({
      NEXT_PUBLIC_API_URL: "http://127.0.0.1:3210",
      NODE_ENV: "test",
    });
  });

  it("rejects invalid NEXT_PUBLIC_API_URL values", () => {
    expect(() =>
      parseWebEnv({
        NEXT_PUBLIC_API_URL: "not-a-url",
      }),
    ).toThrow(ZodError);
  });

  it("rejects unsupported NODE_ENV values", () => {
    expect(() =>
      parseWebEnv({
        NODE_ENV: "staging",
      }),
    ).toThrow(ZodError);
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

  it("parses a test database environment", () => {
    expect(
      parseDatabaseEnv({
        NODE_ENV: "test",
        DATABASE_URL: "postgresql://social_media_test:social_media_test_password@127.0.0.1:55432/social_media_test",
      }),
    ).toEqual({
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://social_media_test:social_media_test_password@127.0.0.1:55432/social_media_test",
    });
  });

  it.each(nodeEnvironments)("accepts NODE_ENV=%s", (nodeEnv) => {
    expect(
      parseDatabaseEnv({
        DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
        NODE_ENV: nodeEnv,
      }),
    ).toEqual({
      DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
      NODE_ENV: nodeEnv,
    });
  });

  it("rejects invalid DATABASE_URL values", () => {
    expect(() =>
      parseDatabaseEnv({
        DATABASE_URL: "not-a-url",
      }),
    ).toThrow(ZodError);
  });

  it("rejects unsupported NODE_ENV values", () => {
    expect(() =>
      parseDatabaseEnv({
        DATABASE_URL: "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
        NODE_ENV: "staging",
      }),
    ).toThrow(ZodError);
  });
});
