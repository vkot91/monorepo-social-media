import { parseDatabaseEnv } from "@social/env";

export function getDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  return parseDatabaseEnv(env).DATABASE_URL;
}
