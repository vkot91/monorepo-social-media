import { resetAndSeedTestDatabase } from "@social/database";

export const resetDatabase = async () => {
  await resetAndSeedTestDatabase();
};
