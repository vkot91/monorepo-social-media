import { createHash, randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { Client } from "pg";

import { getDatabaseUrl } from "../env";
import { assertTestDatabase } from "../seed/test-environment";

type MigrationRecord = {
  migration_name: string;
};

const migrationsPath = resolve(__dirname, "../../prisma/migrations");

const ensureMigrationsTable = async (client: Client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);
};

const getAppliedMigrations = async (client: Client) => {
  const result = await client.query<MigrationRecord>(
    'SELECT "migration_name" FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL AND "rolled_back_at" IS NULL',
  );

  return new Set(result.rows.map((row) => row.migration_name));
};

const checksum = (sql: string) => createHash("sha256").update(sql).digest("hex");

const applyMigration = async (client: Client, migrationName: string, sql: string) => {
  const migrationId = randomUUID();

  await client.query("BEGIN");

  try {
    await client.query(sql);
    await client.query(
      `
        INSERT INTO "_prisma_migrations" (
          "id",
          "checksum",
          "finished_at",
          "migration_name",
          "started_at",
          "applied_steps_count"
        )
        VALUES ($1, $2, now(), $3, now(), 1)
      `,
      [migrationId, checksum(sql), migrationName],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
};

async function main() {
  assertTestDatabase();

  const client = new Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();

  try {
    await ensureMigrationsTable(client);

    const appliedMigrations = await getAppliedMigrations(client);
    const migrationNames = (await readdir(migrationsPath, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    for (const migrationName of migrationNames) {
      if (appliedMigrations.has(migrationName)) {
        continue;
      }

      const migrationSql = await readFile(resolve(migrationsPath, migrationName, "migration.sql"), "utf8");

      await applyMigration(client, migrationName, migrationSql);
      process.stdout.write(`Applied migration ${migrationName}\n`);
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
