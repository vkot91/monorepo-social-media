import { readdir } from "node:fs/promises";
import { resolve } from "node:path";

import { prisma } from "../client";
import type { PrismaClient } from "../generated/prisma/client";

const migrationsPath = resolve(__dirname, "../../prisma/migrations");

const listMigrationDirectories = async (): Promise<string[]> =>
  (await readdir(migrationsPath, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

const listAppliedMigrations = async (client: PrismaClient): Promise<Set<string>> => {
  try {
    const rows = await client.$queryRawUnsafe<{ migration_name: string }[]>(
      'SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL',
    );

    return new Set(rows.map((row) => row.migration_name));
  } catch {
    // The migrations table itself is missing — treat everything as pending.
    return new Set<string>();
  }
};

/**
 * Throws an actionable error when the database is missing migrations that exist
 * on disk. Guards test runs against a stale schema (e.g. a new migration was
 * added but never applied), turning a cryptic `relation ... does not exist`
 * Prisma error into a clear instruction to run `pnpm test:db:migrate`.
 */
export const assertTestMigrationsApplied = async (client: PrismaClient = prisma): Promise<void> => {
  const [onDisk, applied] = await Promise.all([listMigrationDirectories(), listAppliedMigrations(client)]);

  const pending = onDisk.filter((migration) => !applied.has(migration));

  if (pending.length > 0) {
    throw new Error(
      `Test database is missing ${pending.length} migration(s): ${pending.join(", ")}.\n` +
        "Run `pnpm test:db:migrate` before running the tests.",
    );
  }
};
