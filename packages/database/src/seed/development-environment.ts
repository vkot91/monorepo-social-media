import { prisma } from "../client";
import { PostVisibility, type PrismaClient } from "../generated/prisma/client";
import { developmentPosts } from "./post.seed";
import {
  developmentBlocks,
  developmentConversations,
  developmentFriendships,
  developmentMessages,
} from "./social.seed";
import { developmentUsers } from "./user.seed";

// password123
const passwordHash = "$2b$10$iUCaPH6R8EJ0O6.GzZmPEO93OjzZQtxBlMnlMXaJmuwfCqiADzSiS";

export const assertDevelopmentDatabase = () => {
  if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed development data in test or production");
  }
};

export const seedDevelopmentDatabase = async (client: PrismaClient = prisma) => {
  assertDevelopmentDatabase();

  const createdAt = new Date("2026-05-01T12:00:00.000Z");
  const userIds = developmentUsers.map((user) => user.id);

  await client.$transaction(async (tx) => {
    for (const user of developmentUsers) {
      await tx.user.upsert({
        create: {
          ...user,
          createdAt,
          passwordHash,
          updatedAt: createdAt,
        },
        update: {
          displayName: user.displayName,
          email: user.email,
          username: user.username,
          updatedAt: createdAt,
        },
        where: {
          id: user.id,
        },
      });
    }

    await tx.post.deleteMany({
      where: {
        authorId: {
          in: userIds,
        },
      },
    });

    await tx.post.createMany({
      data: developmentPosts.map((post) => ({
        authorId: post.authorId,
        content: post.content,
        createdAt: new Date(post.createdAt),
        id: post.id,
        updatedAt: new Date(post.createdAt),
        visibility: PostVisibility.PUBLIC,
      })),
    });

    await tx.friendship.deleteMany({ where: { requesterId: { in: userIds } } });
    await tx.friendship.createMany({ data: developmentFriendships });

    await tx.userBlock.deleteMany({ where: { blockerId: { in: userIds } } });
    await tx.userBlock.createMany({ data: developmentBlocks });

    await tx.message.deleteMany({
      where: { conversationId: { in: developmentConversations.map((c) => c.id) } },
    });
    await tx.conversationParticipant.deleteMany({
      where: { conversationId: { in: developmentConversations.map((c) => c.id) } },
    });
    await tx.conversation.deleteMany({
      where: { id: { in: developmentConversations.map((c) => c.id) } },
    });

    for (const conv of developmentConversations) {
      await tx.conversation.create({
        data: {
          id: conv.id,
          pairKey: conv.pairKey,
          createdAt: conv.createdAt,
          updatedAt: conv.lastMessageAt ?? conv.createdAt,
          lastMessageAt: conv.lastMessageAt,
          participants: {
            create: conv.participants.map((userId) => ({ userId })),
          },
        },
      });
    }

    await tx.message.createMany({ data: developmentMessages });
  });
};
