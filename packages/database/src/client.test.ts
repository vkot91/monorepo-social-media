import { afterEach, describe, expect, it, vi } from "vitest";

const { adapterConstructorSpy, constructorSpy } = vi.hoisted(() => ({
  adapterConstructorSpy: vi.fn(),
  constructorSpy: vi.fn(),
}));

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class PrismaPg {
    constructor(options: unknown) {
      adapterConstructorSpy(options);
    }
  },
}));

vi.mock("./generated/prisma/client", () => ({
  PrismaClient: class PrismaClient {
    marker = "prisma-client";

    constructor(options: unknown) {
      constructorSpy(options);
    }
  },
}));

afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as { socialPrisma?: unknown }).socialPrisma;
});

describe("createPrismaClient", () => {
  it("creates a Prisma client with development query logging", async () => {
    vi.resetModules();
    adapterConstructorSpy.mockClear();
    constructorSpy.mockClear();
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    );

    const { createPrismaClient } = await import("./client");

    createPrismaClient();

    expect(adapterConstructorSpy).toHaveBeenCalledWith({
      connectionString:
        "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    });
    expect(constructorSpy).toHaveBeenCalledWith({
      adapter: expect.any(Object),
      log: ["query", "warn", "error"],
    });
  });

  it("creates a Prisma client with production error logging", async () => {
    vi.resetModules();
    adapterConstructorSpy.mockClear();
    constructorSpy.mockClear();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    );

    const { createPrismaClient } = await import("./client");

    createPrismaClient();

    expect(constructorSpy).toHaveBeenCalledWith({
      adapter: expect.any(Object),
      log: ["error"],
    });
  });

  it("creates a Prisma client without logging in test env", async () => {
    vi.resetModules();
    adapterConstructorSpy.mockClear();
    constructorSpy.mockClear();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://social_media_test:social_media_test_password@127.0.0.1:55432/social_media_test",
    );

    const { createPrismaClient } = await import("./client");

    createPrismaClient();

    expect(constructorSpy).toHaveBeenCalledWith({
      adapter: expect.any(Object),
      log: [],
    });
  });
});

describe("getPrismaClient", () => {
  it("caches the Prisma client outside production", async () => {
    vi.resetModules();
    constructorSpy.mockClear();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    );

    const { getPrismaClient } = await import("./client");

    const firstClient = getPrismaClient();
    const secondClient = getPrismaClient();

    expect(secondClient).toBe(firstClient);
    expect(constructorSpy).toHaveBeenCalledTimes(1);
  });

  it("does not cache the Prisma client in production", async () => {
    vi.resetModules();
    constructorSpy.mockClear();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    );

    const { getPrismaClient } = await import("./client");

    const firstClient = getPrismaClient();
    const secondClient = getPrismaClient();

    expect(secondClient).not.toBe(firstClient);
    expect(constructorSpy).toHaveBeenCalledTimes(2);
  });
});

describe("prisma", () => {
  it("proxies property access to the Prisma client", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv(
      "DATABASE_URL",
      "postgresql://social_media:social_media_password@127.0.0.1:5432/social_media",
    );

    const { prisma } = await import("./client");

    expect((prisma as unknown as { marker: string }).marker).toBe("prisma-client");
  });
});
