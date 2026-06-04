import { prisma } from "../client";
import { PostVisibility, type PrismaClient } from "../generated/prisma/client";
import { developmentPosts } from "./post.seed";
import { developmentUsers } from "./user.seed";

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
  });
};
