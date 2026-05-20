import { resolve } from "node:path";

import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

const node_env = process.env.NODE_ENV ?? "development";

config({
  path: resolve(__dirname, `../../.env.${node_env}`),
});

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
