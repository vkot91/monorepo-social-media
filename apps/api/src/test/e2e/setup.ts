import { resetAndSeedTestDatabase } from "@social/database";

beforeAll(() => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("API e2e tests require NODE_ENV=test.");
  }
});

beforeEach(async () => {
  await resetAndSeedTestDatabase();
});
