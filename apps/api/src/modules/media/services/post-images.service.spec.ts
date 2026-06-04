import { BadRequestException } from "@nestjs/common";
import { type MediaAsset, MediaAssetKind } from "@social/database";

import { mockedPrisma } from "#test/prisma.mock";

import { MediaAssetsService } from "./media-assets.service";
import { PostImagesService } from "./post-images.service";

const createMediaAssetsService = () =>
  ({
    deleteAssetRows: jest.fn().mockResolvedValue(undefined),
  }) as unknown as jest.Mocked<MediaAssetsService>;

const createService = () => {
  const mediaAssetsService = createMediaAssetsService();
  const service = new PostImagesService(mediaAssetsService);

  return {
    mediaAssetsService,
    service,
  };
};

const createMediaAsset = (overrides: Partial<MediaAsset> = {}): MediaAsset => ({
  createdAt: new Date("2026-05-27T12:00:00.000Z"),
  id: "asset-1",
  kind: MediaAssetKind.IMAGE,
  mimeType: "image/png",
  ownerId: "user-1",
  sizeBytes: 1234,
  storageKey: "social-media/uploads/post-image/user-1/storage-key",
  storageProvider: "cloudinary",
  updatedAt: new Date("2026-05-27T12:00:00.000Z"),
  url: "https://res.cloudinary.com/demo/image/upload/storage-key.png",
  ...overrides,
});

describe("PostImagesService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("replaces post images with retained and uploaded assets in requested order", async () => {
    const { mediaAssetsService, service } = createService();
    const retainedAsset = createMediaAsset({
      id: "retained-asset-1",
      storageKey: "retained-storage-key",
    });
    const removedAsset = createMediaAsset({
      id: "removed-asset-1",
      storageKey: "removed-storage-key",
    });
    const uploadedAsset = createMediaAsset({
      id: "uploaded-asset-1",
      storageKey: "uploaded-storage-key",
    });

    mockedPrisma.postImage.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-27T12:00:00.000Z"),
        id: "post-image-1",
        mediaAsset: retainedAsset,
        mediaAssetId: retainedAsset.id,
        position: 0,
        postId: "post-1",
      },
      {
        createdAt: new Date("2026-05-27T12:00:00.000Z"),
        id: "post-image-2",
        mediaAsset: removedAsset,
        mediaAssetId: removedAsset.id,
        position: 1,
        postId: "post-1",
      },
    ] as never);
    mockedPrisma.mediaAsset.findMany.mockResolvedValue([
      {
        ...retainedAsset,
        postImage: {
          postId: "post-1",
        },
      },
    ] as never);
    mockedPrisma.mediaAsset.deleteMany.mockResolvedValue({ count: 1 });
    mockedPrisma.postImage.deleteMany.mockResolvedValue({ count: 2 });
    mockedPrisma.postImage.createMany.mockResolvedValue({ count: 2 });

    await expect(
      service.replaceImages(
        mockedPrisma,
        "user-1",
        "post-1",
        [
          {
            fileIndex: 0,
            type: "upload",
          },
          {
            id: retainedAsset.id,
            type: "existing",
          },
        ],
        [uploadedAsset],
      ),
    ).resolves.toEqual([removedAsset]);

    expect(mockedPrisma.$queryRawUnsafe).toHaveBeenCalledWith(
      'SELECT "id" FROM "media_assets" WHERE "id" = ANY($1::uuid[]) FOR UPDATE',
      [retainedAsset.id],
    );
    expect(mockedPrisma.postImage.deleteMany).toHaveBeenCalledWith({
      where: {
        postId: "post-1",
      },
    });
    expect(mediaAssetsService.deleteAssetRows).toHaveBeenCalledWith(mockedPrisma, [removedAsset]);
    expect(mockedPrisma.postImage.createMany).toHaveBeenCalledWith({
      data: [
        {
          mediaAssetId: uploadedAsset.id,
          position: 0,
          postId: "post-1",
        },
        {
          mediaAssetId: retainedAsset.id,
          position: 1,
          postId: "post-1",
        },
      ],
    });
    expect(mockedPrisma.mediaAsset.updateMany).not.toHaveBeenCalled();
  });

  it("rejects duplicate retained image assets before replacing post images", async () => {
    const { service } = createService();

    await expect(
      service.replaceImages(
        mockedPrisma,
        "user-1",
        "post-1",
        [
          {
            id: "asset-1",
            type: "existing",
          },
          {
            id: "asset-1",
            type: "existing",
          },
        ],
        [],
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockedPrisma.postImage.deleteMany).not.toHaveBeenCalled();
  });

  it("replaces with upload-only images without locking or checking existing assets", async () => {
    const { service } = createService();
    const uploadedAsset = createMediaAsset({ id: "uploaded-asset-1" });

    mockedPrisma.postImage.findMany.mockResolvedValue([] as never);
    mockedPrisma.postImage.deleteMany.mockResolvedValue({ count: 0 });
    mockedPrisma.postImage.createMany.mockResolvedValue({ count: 1 });

    await expect(
      service.replaceImages(mockedPrisma, "user-1", "post-1", [{ fileIndex: 0, type: "upload" }], [uploadedAsset]),
    ).resolves.toEqual([]);

    expect(mockedPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(mockedPrisma.mediaAsset.findMany).not.toHaveBeenCalled();
    expect(mockedPrisma.postImage.createMany).toHaveBeenCalledWith({
      data: [{ mediaAssetId: uploadedAsset.id, position: 0, postId: "post-1" }],
    });
  });

  it("removes all images when image order is empty", async () => {
    const { mediaAssetsService, service } = createService();
    const existingAsset = createMediaAsset();

    mockedPrisma.postImage.findMany.mockResolvedValue([
      {
        createdAt: new Date("2026-05-27T12:00:00.000Z"),
        id: "post-image-1",
        mediaAsset: existingAsset,
        mediaAssetId: existingAsset.id,
        position: 0,
        postId: "post-1",
      },
    ] as never);
    mockedPrisma.postImage.deleteMany.mockResolvedValue({ count: 1 });
    mockedPrisma.mediaAsset.deleteMany.mockResolvedValue({ count: 1 });

    await expect(service.replaceImages(mockedPrisma, "user-1", "post-1", [], [])).resolves.toEqual([existingAsset]);

    expect(mockedPrisma.$queryRawUnsafe).not.toHaveBeenCalled();
    expect(mockedPrisma.postImage.deleteMany).toHaveBeenCalledWith({ where: { postId: "post-1" } });
    expect(mockedPrisma.postImage.createMany).not.toHaveBeenCalled();
    expect(mediaAssetsService.deleteAssetRows).toHaveBeenCalledWith(mockedPrisma, [existingAsset]);
  });

  it("rejects retaining images from another post", async () => {
    const { service } = createService();
    const attachedAsset = createMediaAsset({
      id: "attached-asset-1",
    });

    mockedPrisma.postImage.findMany.mockResolvedValue([]);
    mockedPrisma.mediaAsset.findMany.mockResolvedValue([
      {
        ...attachedAsset,
        postImage: {
          postId: "other-post",
        },
      },
    ] as never);

    await expect(
      service.replaceImages(
        mockedPrisma,
        "user-1",
        "post-1",
        [
          {
            id: attachedAsset.id,
            type: "existing",
          },
        ],
        [],
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockedPrisma.postImage.deleteMany).not.toHaveBeenCalled();
  });
});
