import { assertTestMigrationsApplied, resetAndSeedTestDatabase } from "@social/database";
import Redis from "ioredis";

import { env } from "#config/env";

// Rate-limit counters live in Redis and outlive a DB reset, so clear them before each test
// (like the DB) to keep suites isolated — otherwise cumulative requests across files could
// trip a limit and fail unrelated tests. The storage wraps keys as `{ratelimit:...}:hits`.
const redis = new Redis(env.REDIS_URL);

beforeAll(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("API e2e tests require NODE_ENV=test.");
  }

  await assertTestMigrationsApplied();
});

beforeEach(async () => {
  await resetAndSeedTestDatabase();

  const rateLimitKeys = await redis.keys("*ratelimit*");

  if (rateLimitKeys.length > 0) {
    await redis.del(...rateLimitKeys);
  }
});

afterAll(async () => {
  await redis.quit();
});
