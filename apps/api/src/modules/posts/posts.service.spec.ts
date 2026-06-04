import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { FriendshipStatus, MediaAssetKind, PostVisibility } from "@social/database";

import { PaginationService } from "#common/pagination/pagination.service";
import { MediaAssetsService } from "#modules/media/services/media-assets.service";
import { PostImagesService } from "#modules/media/services/post-images.service";
import { buildPersistedPost, buildPostDto } from "#test/factories/post.factory";
import { mockedPrisma } from "#test/prisma.mock";

import { PostsService } from "./posts.service";

const persistedPost = buildPersistedPost();

function createMediaAssetsService() {
  return {
    createImageAssets: jest.fn().mockResolvedValue([]),
    deleteAssetRows: jest.fn().mockResolvedValue(undefined),
    deleteStorageFilesBestEffort: jest.fn().mockResolvedValue(undefined),
    toImageAssetCreateData: jest.fn((ownerId, uploadedFile) => ({
      kind: MediaAssetKind.IMAGE,
      mimeType: uploadedFile.mimeType,
      owner: {
        connect: {
          id: ownerId,
        },
      },
      sizeBytes: uploadedFile.sizeBytes,
      storageKey: uploadedFile.storageKey,
      url: uploadedFile.url,
    })),
    uploadPostImageFiles: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<MediaAssetsService>;
}

function createPostImagesService() {
  return {
    replaceImages: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<PostImagesService>;
}

function createService() {
  const mediaAssetsService = createMediaAssetsService();
  const postImagesService = createPostImagesService();

  mockedPrisma.$transaction.mockImplementation((async (callback) => {
    if (typeof callback === "function") {
      return callback(mockedPrisma);
    }

    return Promise.all(callback);
  }) as typeof mockedPrisma.$transaction);
  mockedPrisma.post.create.mockResolvedValue(persistedPost);
  mockedPrisma.post.count.mockResolvedValue(1);
  mockedPrisma.post.findMany.mockResolvedValue([persistedPost]);
  mockedPrisma.post.findFirst.mockResolvedValue(persistedPost);
  mockedPrisma.post.findUnique.mockResolvedValue(persistedPost);
  mockedPrisma.post.findUniqueOrThrow.mockResolvedValue(persistedPost);
  mockedPrisma.post.update.mockResolvedValue({
    ...persistedPost,
    content: "Updated",
    visibility: PostVisibility.FRIENDS,
  });
  mockedPrisma.post.delete.mockResolvedValue(persistedPost);
  mockedPrisma.mediaAsset.deleteMany.mockResolvedValue({ count: 0 });

  return {
    mediaAssetsService,
    postImagesService,
    prisma: mockedPrisma,
    service: new PostsService(new PaginationService(), mediaAssetsService, postImagesService),
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
      include: expect.any(Object),
      data: {
        authorId: "user-1",
        content: "Hello world",
        visibility: "PUBLIC",
      },
    });
    expect(result).toEqual(buildPostDto());
  });

  it("defaults new posts to public visibility", async () => {
    const { prisma, service } = createService();

    await service.create("user-1", {
      content: "Hello world",
    });

    expect(prisma.post.create).toHaveBeenCalledWith({
      include: expect.any(Object),
      data: {
        authorId: "user-1",
        content: "Hello world",
        visibility: "PUBLIC",
      },
    });
  });

  it("attaches uploaded images while creating a post", async () => {
    const { mediaAssetsService, prisma, service } = createService();
    const file = {
      buffer: Buffer.from("image"),
      mimetype: "image/png",
      size: 1234,
    } as Express.Multer.File;
    const uploadedImage = {
      mimeType: "image/png",
      sizeBytes: 1234,
      storageKey: "storage-key-1",
      url: "https://example.com/storage-key-1.png",
    };

    mediaAssetsService.uploadPostImageFiles.mockResolvedValue([uploadedImage]);

    await service.create(
      "user-1",
      {
        content: "Hello world",
      },
      [file],
    );

    expect(mediaAssetsService.uploadPostImageFiles).toHaveBeenCalledWith("user-1", [file]);
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.post.create).toHaveBeenCalledWith({
      include: expect.any(Object),
      data: {
        authorId: "user-1",
        content: "Hello world",
        images: {
          create: [
            {
              mediaAsset: {
                create: {
                  kind: MediaAssetKind.IMAGE,
                  mimeType: "image/png",
                  owner: {
                    connect: {
                      id: "user-1",
                    },
                  },
                  sizeBytes: 1234,
                  storageKey: "storage-key-1",
                  url: "https://example.com/storage-key-1.png",
                },
              },
              position: 0,
            },
          ],
        },
        visibility: "PUBLIC",
      },
    });
  });

  it("lists public posts, own posts, and friends-only posts from accepted friends by default", async () => {
    const { prisma, service } = createService();

    await expect(service.list("user-1", {})).resolves.toMatchObject({
      items: [buildPostDto()],
      pageInfo: {
        hasNextPage: false,
        limit: 20,
        mode: "cursor",
        nextCursor: null,
      },
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 21,
      where: {
        OR: [
          {
            authorId: "user-1",
          },
          {
            AND: [
              {
                author: {
                  blockedUsers: {
                    none: {
                      blockedId: "user-1",
                    },
                  },
                },
              },
              {
                OR: [
                  {
                    visibility: PostVisibility.PUBLIC,
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
            ],
          },
        ],
      },
    });
  });

  it("lists own posts and accepted friends' public and friends-only posts in the friends feed", async () => {
    const { prisma, service } = createService();

    await service.list("user-1", {
      feed: "friends",
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 21,
      where: {
        OR: [
          {
            authorId: "user-1",
          },
          {
            AND: [
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
                visibility: {
                  in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS],
                },
              },
              {
                author: {
                  blockedUsers: {
                    none: {
                      blockedId: "user-1",
                    },
                  },
                },
              },
            ],
          },
        ],
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 21,
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
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 21,
      where: {
        AND: [
          {
            authorId: "user-2",
          },
          {
            author: {
              blockedUsers: {
                none: {
                  blockedId: "user-1",
                },
              },
            },
          },
        ],
      },
    });
  });

  it("uses a stable cursor predicate when a cursor is provided", async () => {
    const { prisma, service } = createService();
    const cursor = new PaginationService().encodeCursor({
      createdAt: "2026-05-05T10:00:00.000Z",
      id: "post-1",
      version: 1,
    });

    await service.list("user-1", {
      authorId: "user-1",
      cursor,
      limit: 10,
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 11,
      where: {
        AND: [
          {
            authorId: "user-1",
          },
          {
            OR: [
              {
                createdAt: {
                  lt: new Date("2026-05-05T10:00:00.000Z"),
                },
              },
              {
                createdAt: new Date("2026-05-05T10:00:00.000Z"),
                id: {
                  lt: "post-1",
                },
              },
            ],
          },
        ],
      },
    });
  });

  it("returns a next cursor when an extra cursor row is found", async () => {
    const { service } = createService();
    mockedPrisma.post.findMany.mockResolvedValue([
      buildPersistedPost({
        id: "post-2",
      }),
      buildPersistedPost({
        id: "post-1",
      }),
    ]);

    await expect(
      service.list("user-1", {
        limit: 1,
      }),
    ).resolves.toMatchObject({
      items: [
        {
          id: "post-2",
        },
      ],
      pageInfo: {
        hasNextPage: true,
        limit: 1,
        mode: "cursor",
        nextCursor: expect.any(String),
      },
    });
  });

  it.skip("lists posts with offset pagination metadata", async () => {
    const { prisma, service } = createService();
    prisma.post.count.mockResolvedValue(25);

    await expect(
      service.list("user-1", {
        authorId: "user-1",
        limit: 10,
        mode: "offset",
        page: 2,
      }),
    ).resolves.toMatchObject({
      items: [buildPostDto()],
      pageInfo: {
        hasNextPage: true,
        hasPreviousPage: true,
        limit: 10,
        mode: "offset",
        page: 2,
        totalItems: 25,
        totalPages: 3,
      },
    });

    expect(prisma.post.findMany).toHaveBeenCalledWith({
      include: expect.any(Object),
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: 10,
      take: 10,
      where: {
        authorId: "user-1",
      },
    });
    expect(prisma.post.count).toHaveBeenCalledWith({
      where: {
        authorId: "user-1",
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
    });

    expect(prisma.post.update).toHaveBeenCalledWith({
      data: {
        content: "Updated",
        visibility: "FRIENDS",
      },
      include: expect.any(Object),
      where: {
        id: "post-1",
      },
    });
    expect(result).toMatchObject({
      content: "Updated",
      visibility: "FRIENDS",
      images: [],
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

  it("replaces images inside a transaction when image order is provided", async () => {
    const { mediaAssetsService, postImagesService, prisma, service } = createService();
    const removedAsset = {
      createdAt: new Date("2026-05-05T10:00:00.000Z"),
      id: "removed-asset-1",
      kind: MediaAssetKind.IMAGE,
      mimeType: "image/jpeg",
      ownerId: "user-1",
      sizeBytes: 1234,
      storageKey: "removed-storage-key",
      storageProvider: "cloudinary",
      updatedAt: new Date("2026-05-05T10:00:00.000Z"),
      url: "https://example.com/removed.jpg",
    };
    const imageOrder = [{ id: "20000000-0000-4000-8000-000000000001", type: "existing" as const }];

    postImagesService.replaceImages.mockResolvedValue([removedAsset]);

    await service.update("user-1", "post-1", {
      imageOrder,
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(prisma.post.update).not.toHaveBeenCalled();
    expect(mediaAssetsService.uploadPostImageFiles).toHaveBeenCalledWith("user-1", []);
    expect(mediaAssetsService.createImageAssets).toHaveBeenCalledWith(prisma, "user-1", []);
    expect(postImagesService.replaceImages).toHaveBeenCalledWith(
      prisma,
      "user-1",
      "post-1",
      imageOrder,
      [],
    );
    expect(prisma.post.findUniqueOrThrow).toHaveBeenCalledWith({
      include: expect.any(Object),
      where: {
        id: "post-1",
      },
    });
    expect(mediaAssetsService.deleteStorageFilesBestEffort).toHaveBeenCalledWith([removedAsset]);
  });

  it("updates content and replaces images in the same transaction", async () => {
    const { postImagesService, prisma, service } = createService();
    const imageOrder = [{ id: "20000000-0000-4000-8000-000000000001", type: "existing" as const }];

    await service.update("user-1", "post-1", {
      content: "Updated",
      imageOrder,
    });

    expect(prisma.post.update).toHaveBeenCalledWith({
      data: {
        content: "Updated",
      },
      where: {
        id: "post-1",
      },
    });
    expect(postImagesService.replaceImages).toHaveBeenCalledWith(
      prisma,
      "user-1",
      "post-1",
      imageOrder,
      [],
    );
  });

  it("rejects uploaded files without image order", async () => {
    const { mediaAssetsService, service } = createService();
    const file = {
      buffer: Buffer.from("image"),
      mimetype: "image/png",
      size: 1234,
    } as Express.Multer.File;

    await expect(
      service.update(
        "user-1",
        "post-1",
        {
          content: "Updated",
        },
        [file],
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mediaAssetsService.uploadPostImageFiles).not.toHaveBeenCalled();
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
    const { mediaAssetsService, prisma, service } = createService();

    await service.remove("user-1", "post-1");

    expect(prisma.post.findUnique).toHaveBeenLastCalledWith({
      include: {
        images: {
          include: {
            mediaAsset: true,
          },
        },
      },
      where: {
        id: "post-1",
      },
    });
    expect(prisma.post.delete).toHaveBeenCalledWith({
      where: {
        id: "post-1",
      },
    });
    expect(mediaAssetsService.deleteAssetRows).toHaveBeenCalledWith(prisma, []);
    expect(mediaAssetsService.deleteStorageFilesBestEffort).toHaveBeenCalledWith([]);
  });

  it("deletes attached media asset rows and files when deleting a post", async () => {
    const { mediaAssetsService, prisma, service } = createService();
    const mediaAsset = {
      createdAt: new Date("2026-05-05T10:00:00.000Z"),
      id: "media-asset-1",
      kind: MediaAssetKind.IMAGE,
      mimeType: "image/jpeg",
      ownerId: "user-1",
      sizeBytes: 1234,
      storageKey: "attached-storage-key",
      storageProvider: "cloudinary",
      updatedAt: new Date("2026-05-05T10:00:00.000Z"),
      url: "https://example.com/attached.jpg",
    };

    prisma.post.findUnique
      .mockResolvedValueOnce(persistedPost)
      .mockResolvedValueOnce({
        ...persistedPost,
        images: [
          {
            createdAt: new Date("2026-05-05T10:00:00.000Z"),
            id: "post-image-1",
            mediaAsset,
            mediaAssetId: mediaAsset.id,
            position: 0,
            postId: "post-1",
          },
        ],
      } as never);

    await service.remove("user-1", "post-1");

    expect(mediaAssetsService.deleteAssetRows).toHaveBeenCalledWith(prisma, [mediaAsset]);
    expect(mediaAssetsService.deleteStorageFilesBestEffort).toHaveBeenCalledWith([mediaAsset]);
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
