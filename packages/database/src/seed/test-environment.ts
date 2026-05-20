import { prisma } from "../client";
import { PostVisibility, type PrismaClient } from "../generated/prisma/client";
import { testPosts } from "./posts.seed";
import { testUsers } from "./users.seed";

const passwordHash = "$2b$10$iUCaPH6R8EJ0O6.GzZmPEO93OjzZQtxBlMnlMXaJmuwfCqiADzSiS";

export const assertTestDatabase = () => {
  if (process.env.NODE_ENV !== "test") {
    throw new Error("Refusing to reset a database unless NODE_ENV=test");
  }
};

export const resetTestDatabase = async (client: PrismaClient = prisma) => {
  assertTestDatabase();

  await client.$executeRawUnsafe(
    'TRUNCATE TABLE "comments", "friendships", "post_likes", "posts", "refresh_tokens", "user_blocks", "users" RESTART IDENTITY CASCADE',
  );
};

export const seedTestDatabase = async (client: PrismaClient = prisma) => {
  assertTestDatabase();

  const createdAt = new Date("2026-05-01T12:00:00.000Z");

  await client.user.createMany({
    data: Object.values(testUsers).map((user) => ({
      ...user,
      createdAt,
      passwordHash,
      updatedAt: createdAt,
    })),
  });

  await client.post.create({
    data: {
      authorId: testUsers.login.id,
      content: testPosts.mayaFeed.content,
      createdAt,
      id: testPosts.mayaFeed.id,
      updatedAt: createdAt,
      visibility: PostVisibility.FRIENDS,
    },
  });
};

export const resetAndSeedTestDatabase = async (client: PrismaClient = prisma) => {
  await resetTestDatabase(client);
  await seedTestDatabase(client);
};
