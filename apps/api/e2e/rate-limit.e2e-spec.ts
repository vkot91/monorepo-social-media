import type { INestApplication } from "@nestjs/common";

import { env } from "#config/env";
import { closeTestApp, createTestApp } from "#e2e/support/create-app";
import { makeRequest, type RequestFn } from "#e2e/support/request";

// Rate-limit counters are flushed before each test by the shared e2e setup.

let app: INestApplication;
let request: RequestFn;

const attemptLogin = (email: string) =>
  request("/auth/login", {
    body: JSON.stringify({ email, password: "wrong-password" }),
    method: "POST",
  });

beforeAll(async () => {
  app = await createTestApp();
  request = makeRequest(await app.getUrl());
});

afterAll(async () => {
  await closeTestApp(app);
});

describe("rate limiting", () => {
  it("blocks auth attempts past the per-IP limit with 429 and a Retry-After header", async () => {
    const limit = env.RATE_LIMIT_AUTH_LIMIT;

    for (let i = 0; i < limit; i += 1) {
      const { response } = await attemptLogin("nobody@example.com");
      expect(response.status).not.toBe(429); // within budget (401 for bad credentials)
    }

    const { response } = await attemptLogin("nobody@example.com");

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toEqual(expect.any(String));
  });

  it("annotates allowed responses with X-RateLimit headers", async () => {
    const { response } = await attemptLogin("someone@example.com");

    expect(response.headers.get("x-ratelimit-limit")).toBe(String(env.RATE_LIMIT_AUTH_LIMIT));
    expect(response.headers.get("x-ratelimit-remaining")).toEqual(expect.any(String));
  });

  it("exempts @SkipThrottle health checks from rate limiting", async () => {
    // More requests than the auth budget; health is skipped so it never throttles or sets headers.
    for (let i = 0; i < env.RATE_LIMIT_AUTH_LIMIT + 5; i += 1) {
      const { response } = await request("/health");
      expect(response.status).toBe(200);
      expect(response.headers.get("x-ratelimit-limit")).toBeNull();
    }
  });
});
