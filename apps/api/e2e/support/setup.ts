import { assertTestMigrationsApplied, resetAndSeedTestDatabase } from "@social/database";

beforeAll(async () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("API e2e tests require NODE_ENV=test.");
  }

  await assertTestMigrationsApplied();
});

beforeEach(async () => {
  await resetAndSeedTestDatabase();
});
