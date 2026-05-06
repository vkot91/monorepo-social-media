import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { parseApiEnv, parseDatabaseEnv, parseWebEnv } from "./index";

const validSecret = "a".repeat(32);
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

  it("treats an empty PORT value as unset", () => {
    const env = parseApiEnv({
      ...validApiEnv,
      PORT: "",
    });

    expect(env.PORT).toBe(3001);
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
