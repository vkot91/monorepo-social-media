import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { FriendshipStatus, PostVisibility, prisma } from "@social/database";

import { PostsService } from "./posts.service";

jest.mock("@social/database", () => ({
  PostVisibility: {
    FRIENDS: "FRIENDS",
    PUBLIC: "PUBLIC",
  },
  FriendshipStatus: {
    ACCEPTED: "ACCEPTED",
  },
  prisma: {
    post: {
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const persistedPost = {
  author: {
    avatarUrl: null,
    displayName: "Ada Lovelace",
    id: "user-1",
    username: "ada",
  },
  authorId: "user-1",
  content: "Hello world",
  createdAt: new Date("2026-05-05T10:00:00.000Z"),
  id: "post-1",
  imageUrl: null,
  updatedAt: new Date("2026-05-05T10:30:00.000Z"),
  visibility: PostVisibility.PUBLIC,
};

type MockedPrisma = {
  post: {
    create: jest.Mock;
    delete: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
};

function createService() {
  const mockedPrisma = prisma as unknown as MockedPrisma;

  mockedPrisma.post.create.mockResolvedValue(persistedPost);
  mockedPrisma.post.findMany.mockResolvedValue([persistedPost]);
  mockedPrisma.post.findFirst.mockResolvedValue(persistedPost);
  mockedPrisma.post.findUnique.mockResolvedValue(persistedPost);
  mockedPrisma.post.update.mockResolvedValue({
    ...persistedPost,
    content: "Updated",
    imageUrl: "https://example.com/image.jpg",
    visibility: PostVisibility.FRIENDS,
  });
  mockedPrisma.post.delete.mockResolvedValue(persistedPost);

  return {
    prisma: mockedPrisma,
    service: new PostsService(),
  };
}

describe("PostsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a post for the authenticated user without image upload fields", async () => {
    const { prisma, service } = createService();

    const result = await service.create("user-1", {
      content: "Hello world",
      visibility: "PUBLIC",
    });

    expect(prisma.post.create).toHaveBeenCalledWith({
      data: {
        authorId: "user-1",
        content: "Hello world",
        imageUrl: null,
        visibility: "PUBLIC",
      },
      include: expect.any(Object),
    });
    expect(result).toEqual({
      author: {
        avatarUrl: null,
        displayName: "Ada Lovelace",
        id: "user-1",
        username: "ada",
      },
      content: "Hello world",
      createdAt: "2026-05-05T10:00:00.000Z",
      id: "post-1",
      imageUrl: null,
      updatedAt: "2026-05-05T10:30:00.000Z",
      visibility: "PUBLIC",
    });
  });

  it("defaults new posts to public visibility", async () => {
    const { prisma, service } = createService();

    await service.create("user-1", {
      content: "Hello world",
    });

    expect(prisma.post.create).toHaveBeenCalledWith({
      data: {
        authorId: "user-1",
        content: "Hello world",
        imageUrl: null,
        visibility: "PUBLIC",
      },
      include: expect.any(Object),
    });
  });

  it("lists public posts, own posts, and friends-only posts from accepted friends by default", async () => {
    const { prisma, service } = createService();

    await expect(service.list("user-1", {})).resolves.toEqual([
      {
        author: {
          avatarUrl: null,
          displayName: "Ada Lovelace",
          id: "user-1",
          username: "ada",
        },
        content: "Hello world",
        createdAt: "2026-05-05T10:00:00.000Z",
        id: "post-1",
        imageUrl: null,
        updatedAt: "2026-05-05T10:30:00.000Z",
        visibility: "PUBLIC",
      },
    ]);

    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: {
        createdAt: "desc",
      },
      where: {
        OR: [
          {
            visibility: PostVisibility.PUBLIC,
          },
          {
            authorId: "user-1",
          },
          {
            author: {
              OR: [
                {
                  sentFriendshipRequests: {
                    some: {
                      addresseeId: "user-1",
                      status: FriendshipStatus.ACCEPTED,
                    },
                  },
                },
                {
                  receivedFriendshipRequests: {
                    some: {
                      requesterId: "user-1",
                      status: FriendshipStatus.ACCEPTED,
                    },
                  },
                },
              ],
            },
            visibility: PostVisibility.FRIENDS,
          },
        ],
      },
    });
  });

  it("lists accepted friends' public and friends-only posts", async () => {
    const { prisma, service } = createService();

    await service.list("user-1", {
      feed: "friends",
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: {
        createdAt: "desc",
      },
      where: {
        author: {
          OR: [
            {
              sentFriendshipRequests: {
                some: {
                  addresseeId: "user-1",
                  status: FriendshipStatus.ACCEPTED,
                },
              },
            },
            {
              receivedFriendshipRequests: {
                some: {
                  requesterId: "user-1",
                  status: FriendshipStatus.ACCEPTED,
                },
              },
            },
          ],
        },
        visibility: {
          in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS],
        },
      },
    });
  });

  it("lists all posts by the authenticated author", async () => {
    const { prisma, service } = createService();

    await service.list("user-1", {
      authorId: "user-1",
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: {
        createdAt: "desc",
      },
      where: {
        authorId: "user-1",
      },
    });
  });

  it("lists only posts by the requested author", async () => {
    const { prisma, service } = createService();

    await service.list("user-1", {
      authorId: "user-2",
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: {
        createdAt: "desc",
      },
      where: {
        authorId: "user-2",
      },
    });
  });

  it("finds one owned post", async () => {
    const { prisma, service } = createService();

    await expect(service.findOne("user-1", "post-1")).resolves.toMatchObject({
      id: "post-1",
    });

    expect(prisma.post.findFirst).toHaveBeenCalledWith({
      include: expect.any(Object),
      where: {
        authorId: "user-1",
        id: "post-1",
      },
    });
  });

  it("throws not found when the authenticated user cannot access the post", async () => {
    const { prisma, service } = createService();
    prisma.post.findFirst.mockResolvedValue(null);

    await expect(service.findOne("user-1", "post-1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updates an owned post", async () => {
    const { prisma, service } = createService();

    const result = await service.update("user-1", "post-1", {
      content: "Updated",
      visibility: "FRIENDS",
      imageUrl: "https://example.com/image.jpg",
    });

    expect(prisma.post.update).toHaveBeenCalledWith({
      data: {
        content: "Updated",
        visibility: "FRIENDS",
        imageUrl: "https://example.com/image.jpg",
      },
      include: expect.any(Object),
      where: {
        id: "post-1",
      },
    });
    expect(result).toMatchObject({
      content: "Updated",
      visibility: "FRIENDS",
      imageUrl: "https://example.com/image.jpg",
    });
  });

  it("updates only the content", async () => {
    const { prisma, service } = createService();

    await service.update("user-1", "post-1", {
      content: "Updated",
    });

    expect(prisma.post.update).toHaveBeenCalledWith({
      data: {
        content: "Updated",
      },
      include: expect.any(Object),
      where: {
        id: "post-1",
      },
    });
  });

  it("updates only the visibility", async () => {
    const { prisma, service } = createService();

    await service.update("user-1", "post-1", {
      visibility: "FRIENDS",
    });

    expect(prisma.post.update).toHaveBeenCalledWith({
      data: {
        visibility: "FRIENDS",
      },
      include: expect.any(Object),
      where: {
        id: "post-1",
      },
    });
  });

  it("updates only the imageUrl", async () => {
    const { prisma, service } = createService();

    await service.update("user-1", "post-1", {
      imageUrl: "https://example.com/image.jpg",
    });

    expect(prisma.post.update).toHaveBeenCalledWith({
      data: {
        imageUrl: "https://example.com/image.jpg",
      },
      include: expect.any(Object),
      where: {
        id: "post-1",
      },
    });
  });

  it("rejects updates to another user's post", async () => {
    const { prisma, service } = createService();
    prisma.post.findUnique.mockResolvedValue({
      ...persistedPost,
      authorId: "user-2",
    });

    await expect(
      service.update("user-1", "post-1", {
        content: "Updated",
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.post.update).not.toHaveBeenCalled();
  });

  it("throws not found when updating a missing post", async () => {
    const { prisma, service } = createService();
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(
      service.update("user-1", "post-1", {
        content: "Updated",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("deletes an owned post", async () => {
    const { prisma, service } = createService();

    await service.remove("user-1", "post-1");

    expect(prisma.post.delete).toHaveBeenCalledWith({
      where: {
        id: "post-1",
      },
    });
  });

  it("rejects deleting another user's post", async () => {
    const { prisma, service } = createService();
    prisma.post.findUnique.mockResolvedValue({
      ...persistedPost,
      authorId: "user-2",
    });

    await expect(service.remove("user-1", "post-1")).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.post.delete).not.toHaveBeenCalled();
  });

  it("throws not found when deleting a missing post", async () => {
    const { prisma, service } = createService();
    prisma.post.findUnique.mockResolvedValue(null);

    await expect(service.remove("user-1", "post-1")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.post.delete).not.toHaveBeenCalled();
  });
});
