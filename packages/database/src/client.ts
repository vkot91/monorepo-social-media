import { PrismaPg } from "@prisma/adapter-pg";

import { getDatabaseUrl } from "./env";
import { Prisma, PrismaClient } from "./generated/prisma/client";

type GlobalWithPrisma = typeof globalThis & {
  socialPrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

const getPrismaLogLevels = (): Prisma.LogLevel[] => {
  if (process.env.NODE_ENV === "development") {
    return ["query", "warn", "error"];
  }

  if (process.env.NODE_ENV === "test") {
    return [];
  }

  return ["error"];
};

export function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({
    connectionString: getDatabaseUrl(),
  });

  return new PrismaClient({
    adapter,
    log: getPrismaLogLevels(),
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
