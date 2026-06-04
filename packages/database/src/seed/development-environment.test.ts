import { afterEach, describe, expect, it, vi } from "vitest";

import { PostVisibility, type PrismaClient } from "../generated/prisma/client";
import { developmentPosts } from "./post.seed";
import { developmentUsers } from "./user.seed";

const txMock = vi.hoisted(() => ({
  post: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    upsert: vi.fn(),
  },
}));

const prismaMock = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<void>) => callback(txMock)),
}));

vi.mock("../client", () => ({
  prisma: prismaMock,
}));

const createClientMock = () =>
  ({
    $transaction: vi.fn(async (callback: (tx: typeof txMock) => Promise<void>) => callback(txMock)),
  }) as unknown as PrismaClient;

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("development seed fixtures", () => {
  it("defines three users and ten posts for each user", () => {
    expect(developmentUsers).toHaveLength(3);
    expect(developmentPosts).toHaveLength(30);

    for (const user of developmentUsers) {
      expect(developmentPosts.filter((post) => post.authorId === user.id)).toHaveLength(10);
    }
  });
});

describe("assertDevelopmentDatabase", () => {
  it("allows development data outside test and production", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { assertDevelopmentDatabase } = await import("./development-environment");

    expect(() => assertDevelopmentDatabase()).not.toThrow();
  });

  it("rejects test and production environments", async () => {
    const { assertDevelopmentDatabase } = await import("./development-environment");

    vi.stubEnv("NODE_ENV", "test");
    expect(() => assertDevelopmentDatabase()).toThrow("Refusing to seed development data in test or production");

    vi.stubEnv("NODE_ENV", "production");
    expect(() => assertDevelopmentDatabase()).toThrow("Refusing to seed development data in test or production");
  });
});

describe("seedDevelopmentDatabase", () => {
  it("upserts development users and recreates only their posts", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const client = createClientMock();
    const { seedDevelopmentDatabase } = await import("./development-environment");

    await seedDevelopmentDatabase(client);

    const createdAt = new Date("2026-05-01T12:00:00.000Z");
    const passwordHash = "$2b$10$iUCaPH6R8EJ0O6.GzZmPEO93OjzZQtxBlMnlMXaJmuwfCqiADzSiS";

    expect(txMock.user.upsert).toHaveBeenCalledTimes(3);
    expect(txMock.user.upsert).toHaveBeenCalledWith({
      create: {
        ...developmentUsers[0],
        createdAt,
        passwordHash,
        updatedAt: createdAt,
      },
      update: {
        displayName: developmentUsers[0]?.displayName,
        email: developmentUsers[0]?.email,
        username: developmentUsers[0]?.username,
        updatedAt: createdAt,
      },
      where: {
        id: developmentUsers[0]?.id,
      },
    });
    expect(txMock.post.deleteMany).toHaveBeenCalledWith({
      where: {
        authorId: {
          in: developmentUsers.map((user) => user.id),
        },
      },
    });
    expect(txMock.post.createMany).toHaveBeenCalledWith({
      data: developmentPosts.map((post) => ({
        authorId: post.authorId,
        content: post.content,
        createdAt: new Date(post.createdAt),
        id: post.id,
        updatedAt: new Date(post.createdAt),
        visibility: PostVisibility.PUBLIC,
      })),
    });
  });

  it("uses the shared Prisma client when no client is provided", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { seedDevelopmentDatabase } = await import("./development-environment");

    await seedDevelopmentDatabase();

    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function));
  });
});
