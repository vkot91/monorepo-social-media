import { describe, expect, it, vi } from "vitest";

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
    constructor(options: unknown) {
      constructorSpy(options);
    }
  },
}));

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
});
