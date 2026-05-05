import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "./generated/prisma/client";

import { getDatabaseUrl } from "./env";

type GlobalWithPrisma = typeof globalThis & {
  socialPrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  });
}

export function getPrismaClient(): PrismaClient {
  const cachedPrisma = globalForPrisma.socialPrisma;

  if (cachedPrisma) {
    return cachedPrisma;
  }

  const prisma = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.socialPrisma = prisma;
  }

  return prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getPrismaClient() as object, property, receiver);
  },
});
