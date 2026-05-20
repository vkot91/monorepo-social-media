import { afterEach, describe, expect, it, vi } from "vitest";

import { PostVisibility, type PrismaClient } from "../generated/prisma/client";
import { testPosts } from "./posts.seed";
import { testUsers } from "./users.seed";

const prismaMock = vi.hoisted(() => ({
  $executeRawUnsafe: vi.fn(),
  post: {
    create: vi.fn(),
  },
  user: {
    createMany: vi.fn(),
  },
}));

vi.mock("../client", () => ({
  prisma: prismaMock,
}));

const createClientMock = () =>
  ({
    $executeRawUnsafe: vi.fn(),
    post: {
      create: vi.fn(),
    },
    user: {
      createMany: vi.fn(),
    },
  }) as unknown as PrismaClient;

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
});

describe("assertTestDatabase", () => {
  it("allows database changes in the test environment", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { assertTestDatabase } = await import("./test-environment");

    expect(() => assertTestDatabase()).not.toThrow();
  });

  it("rejects database changes outside the test environment", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { assertTestDatabase } = await import("./test-environment");

    expect(() => assertTestDatabase()).toThrow(
      "Refusing to reset a database unless NODE_ENV=test",
    );
  });
});

describe("resetTestDatabase", () => {
  it("truncates test tables with identity reset and cascade", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const client = createClientMock();
    const { resetTestDatabase } = await import("./test-environment");

    await resetTestDatabase(client);

    expect(client.$executeRawUnsafe).toHaveBeenCalledWith(
      'TRUNCATE TABLE "comments", "friendships", "post_likes", "posts", "refresh_tokens", "user_blocks", "users" RESTART IDENTITY CASCADE',
    );
  });

  it("uses the shared Prisma client when no client is provided", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const { resetTestDatabase } = await import("./test-environment");

    await resetTestDatabase();

    expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
      'TRUNCATE TABLE "comments", "friendships", "post_likes", "posts", "refresh_tokens", "user_blocks", "users" RESTART IDENTITY CASCADE',
    );
  });
});

describe("seedTestDatabase", () => {
  it("creates deterministic users and a friends-only post", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const client = createClientMock();
    const { seedTestDatabase } = await import("./test-environment");

    await seedTestDatabase(client);

    const createdAt = new Date("2026-05-01T12:00:00.000Z");
    const passwordHash = "$2b$10$iUCaPH6R8EJ0O6.GzZmPEO93OjzZQtxBlMnlMXaJmuwfCqiADzSiS";

    expect(client.user.createMany).toHaveBeenCalledWith({
      data: Object.values(testUsers).map((user) => ({
        ...user,
        createdAt,
        passwordHash,
        updatedAt: createdAt,
      })),
    });
    expect(client.post.create).toHaveBeenCalledWith({
      data: {
        authorId: testUsers.login.id,
        content: testPosts.mayaFeed.content,
        createdAt,
        id: testPosts.mayaFeed.id,
        updatedAt: createdAt,
        visibility: PostVisibility.FRIENDS,
      },
    });
  });
});

describe("resetAndSeedTestDatabase", () => {
  it("resets the database before seeding it", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const client = createClientMock();
    const { resetAndSeedTestDatabase } = await import("./test-environment");

    await resetAndSeedTestDatabase(client);

    expect(vi.mocked(client.$executeRawUnsafe).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(client.user.createMany).mock.invocationCallOrder[0] ?? 0,
    );
    expect(vi.mocked(client.user.createMany).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(client.post.create).mock.invocationCallOrder[0] ?? 0,
    );
  });
});
