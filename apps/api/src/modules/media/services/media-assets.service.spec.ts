import { type MediaAsset, MediaAssetKind } from "@social/database";

import { LoggingService } from "#common/logging/logging.service";
import { mockedPrisma } from "#test/prisma.mock";

import { CloudinaryMediaService } from "./cloudinary-media.service";
import { MediaAssetsService } from "./media-assets.service";

const createCloudinaryMediaService = () =>
  ({
    deleteFile: jest.fn(),
    uploadImage: jest.fn(),
  }) as unknown as jest.Mocked<CloudinaryMediaService>;

const createLoggingService = () =>
  ({
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  }) as unknown as jest.Mocked<LoggingService>;

const createService = () => {
  const cloudinaryMediaService = createCloudinaryMediaService();
  const loggingService = createLoggingService();
  const service = new MediaAssetsService(cloudinaryMediaService, loggingService);

  return {
    cloudinaryMediaService,
    loggingService,
    service,
  };
};

const createImageFile = (overrides: Partial<Express.Multer.File> = {}) =>
  ({
    buffer: Buffer.from("image"),
    mimetype: "image/png",
    size: 1234,
    ...overrides,
  }) as Express.Multer.File;

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

describe("MediaAssetsService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uploads post images to Cloudinary in multipart order", async () => {
    const { cloudinaryMediaService, service } = createService();
    const firstFile = createImageFile({ size: 100 });
    const secondFile = createImageFile({ mimetype: "image/jpeg", size: 200 });

    cloudinaryMediaService.uploadImage
      .mockResolvedValueOnce({
        storageKey: "storage-key-1",
        url: "https://example.com/storage-key-1.png",
      })
      .mockResolvedValueOnce({
        storageKey: "storage-key-2",
        url: "https://example.com/storage-key-2.jpg",
      });

    await expect(service.uploadPostImageFiles("user-1", [firstFile, secondFile])).resolves.toEqual([
      {
        mimeType: "image/png",
        sizeBytes: 100,
        storageKey: "storage-key-1",
        url: "https://example.com/storage-key-1.png",
      },
      {
        mimeType: "image/jpeg",
        sizeBytes: 200,
        storageKey: "storage-key-2",
        url: "https://example.com/storage-key-2.jpg",
      },
    ]);
    expect(cloudinaryMediaService.uploadImage).toHaveBeenNthCalledWith(1, firstFile, "user-1", "post-image");
    expect(cloudinaryMediaService.uploadImage).toHaveBeenNthCalledWith(2, secondFile, "user-1", "post-image");
  });

  it("deletes already-uploaded files when a later upload fails", async () => {
    const { cloudinaryMediaService, service } = createService();
    const error = new Error("cloudinary failed");

    cloudinaryMediaService.uploadImage
      .mockResolvedValueOnce({
        storageKey: "storage-key-1",
        url: "https://example.com/storage-key-1.png",
      })
      .mockRejectedValueOnce(error);

    await expect(service.uploadPostImageFiles("user-1", [createImageFile(), createImageFile()])).rejects.toBe(error);
    expect(cloudinaryMediaService.deleteFile).toHaveBeenCalledWith("storage-key-1");
  });

  it("creates uploaded media asset rows inside the provided transaction", async () => {
    const { service } = createService();

    mockedPrisma.mediaAsset.create.mockResolvedValue(createMediaAsset());

    await expect(
      service.createImageAssets(mockedPrisma, "user-1", [
        {
          mimeType: "image/png",
          sizeBytes: 1234,
          storageKey: "storage-key-1",
          url: "https://example.com/storage-key-1.png",
        },
      ]),
    ).resolves.toEqual([createMediaAsset()]);
    expect(mockedPrisma.mediaAsset.create).toHaveBeenCalledWith({
      data: {
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
    });
  });

  it("deletes storage files best-effort", async () => {
    const { cloudinaryMediaService, service } = createService();
    const asset = createMediaAsset();

    await service.deleteStorageFilesBestEffort([asset]);

    expect(cloudinaryMediaService.deleteFile).toHaveBeenCalledWith(asset.storageKey);
  });

  it("logs and swallows best-effort storage deletion failures", async () => {
    const { cloudinaryMediaService, loggingService, service } = createService();
    const error = new Error("cloudinary failed");

    cloudinaryMediaService.deleteFile.mockRejectedValueOnce(error);

    await expect(service.deleteStorageFilesBestEffort([createMediaAsset()])).resolves.toBeUndefined();
    expect(loggingService.error).toHaveBeenCalledWith(
      MediaAssetsService.name,
      "Best-effort Cloudinary deletion failed for media asset-1",
      error.stack,
    );
  });

  it("falls back to storageKey in the error label when the asset has no id", async () => {
    const { cloudinaryMediaService, loggingService, service } = createService();
    const error = new Error("cloudinary failed");

    cloudinaryMediaService.deleteFile.mockRejectedValueOnce(error);

    await service.deleteStorageFilesBestEffort([{ storageKey: "orphan-storage-key" }]);

    expect(loggingService.error).toHaveBeenCalledWith(
      MediaAssetsService.name,
      "Best-effort Cloudinary deletion failed for media orphan-storage-key",
      error.stack,
    );
  });

  it("logs undefined stack when the rejection reason is not an Error", async () => {
    const { cloudinaryMediaService, loggingService, service } = createService();

    cloudinaryMediaService.deleteFile.mockRejectedValueOnce("string rejection reason");

    await service.deleteStorageFilesBestEffort([createMediaAsset()]);

    expect(loggingService.error).toHaveBeenCalledWith(
      MediaAssetsService.name,
      "Best-effort Cloudinary deletion failed for media asset-1",
      undefined,
    );
  });

  it("skips deleteMany when the asset list is empty", async () => {
    const { service } = createService();

    await expect(service.deleteAssetRows(mockedPrisma, [])).resolves.toBeUndefined();
    expect(mockedPrisma.mediaAsset.deleteMany).not.toHaveBeenCalled();
  });

  it("deletes matching asset rows by id inside the provided transaction", async () => {
    const { service } = createService();
    const assets = [createMediaAsset({ id: "asset-1" }), createMediaAsset({ id: "asset-2" })];

    mockedPrisma.mediaAsset.deleteMany.mockResolvedValue({ count: 2 });

    await expect(service.deleteAssetRows(mockedPrisma, assets)).resolves.toBeUndefined();
    expect(mockedPrisma.mediaAsset.deleteMany).toHaveBeenCalledWith({
      where: {
        id: {
          in: ["asset-1", "asset-2"],
        },
      },
    });
  });
});
