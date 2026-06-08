import { afterEach, describe, expect, it, vi } from "vitest";

import { PostVisibility, type PrismaClient } from "../generated/prisma/client";
import { developmentPosts } from "./post.seed";
import { developmentBlocks, developmentConversations, developmentFriendships, developmentMessages } from "./social.seed";
import { developmentUsers } from "./user.seed";

const txMock = vi.hoisted(() => ({
  conversation: {
    create: vi.fn(),
    deleteMany: vi.fn(),
  },
  conversationParticipant: {
    deleteMany: vi.fn(),
  },
  friendship: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  message: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  post: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
  },
  user: {
    upsert: vi.fn(),
  },
  userBlock: {
    createMany: vi.fn(),
    deleteMany: vi.fn(),
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
  it("defines users and ten posts", () => {
    expect(developmentUsers).toHaveLength(8);
    expect(developmentPosts).toHaveLength(80);

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
  it("upserts development users and recreates their posts, friendships, blocks, conversations, and messages", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const client = createClientMock();
    const { seedDevelopmentDatabase } = await import("./development-environment");

    await seedDevelopmentDatabase(client);

    const createdAt = new Date("2026-05-01T12:00:00.000Z");
    const passwordHash = "$2b$10$iUCaPH6R8EJ0O6.GzZmPEO93OjzZQtxBlMnlMXaJmuwfCqiADzSiS";

    expect(txMock.user.upsert).toHaveBeenCalledTimes(developmentUsers.length);
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

    const userIds = developmentUsers.map((u) => u.id);
    const conversationIds = developmentConversations.map((c) => c.id);

    expect(txMock.friendship.deleteMany).toHaveBeenCalledWith({ where: { requesterId: { in: userIds } } });
    expect(txMock.friendship.createMany).toHaveBeenCalledWith({ data: developmentFriendships });

    expect(txMock.userBlock.deleteMany).toHaveBeenCalledWith({ where: { blockerId: { in: userIds } } });
    expect(txMock.userBlock.createMany).toHaveBeenCalledWith({ data: developmentBlocks });

    expect(txMock.message.deleteMany).toHaveBeenCalledWith({ where: { conversationId: { in: conversationIds } } });
    expect(txMock.conversationParticipant.deleteMany).toHaveBeenCalledWith({ where: { conversationId: { in: conversationIds } } });
    expect(txMock.conversation.deleteMany).toHaveBeenCalledWith({ where: { id: { in: conversationIds } } });

    expect(txMock.conversation.create).toHaveBeenCalledTimes(developmentConversations.length);
    expect(txMock.conversation.create).toHaveBeenCalledWith({
      data: {
        id: developmentConversations[0]?.id,
        pairKey: developmentConversations[0]?.pairKey,
        createdAt: developmentConversations[0]?.createdAt,
        updatedAt: developmentConversations[0]?.lastMessageAt ?? developmentConversations[0]?.createdAt,
        lastMessageAt: developmentConversations[0]?.lastMessageAt,
        participants: {
          create: developmentConversations[0]?.participants.map((userId) => ({ userId })),
        },
      },
    });

    expect(txMock.message.createMany).toHaveBeenCalledWith({ data: developmentMessages });
  });

  it("uses the shared Prisma client when no client is provided", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const { seedDevelopmentDatabase } = await import("./development-environment");

    await seedDevelopmentDatabase();

    expect(prismaMock.$transaction).toHaveBeenCalledWith(expect.any(Function));
  });
});
