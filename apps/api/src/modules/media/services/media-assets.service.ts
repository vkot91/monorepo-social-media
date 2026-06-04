import { Injectable } from "@nestjs/common";
import { type MediaAsset, MediaAssetKind, type Prisma } from "@social/database";

import { LoggingService } from "#common/logging/logging.service";

import { CloudinaryMediaService } from "./cloudinary-media.service";

export type UploadedMediaFile = {
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  url: string;
};

type StoredMediaFile = {
  id?: string;
  storageKey: string;
};

@Injectable()
export class MediaAssetsService {
  constructor(
    private readonly cloudinaryMediaService: CloudinaryMediaService,
    private readonly loggingService: LoggingService,
  ) {}

  async uploadPostImageFiles(ownerId: string, files: Express.Multer.File[]): Promise<UploadedMediaFile[]> {
    const uploadedFiles: UploadedMediaFile[] = [];

    try {
      for (const file of files) {
        const uploadedImage = await this.cloudinaryMediaService.uploadImage(file, ownerId, "post-image");

        uploadedFiles.push({
          mimeType: file.mimetype,
          sizeBytes: file.size,
          storageKey: uploadedImage.storageKey,
          url: uploadedImage.url,
        });
      }

      return uploadedFiles;
    } catch (error) {
      await this.deleteStorageFilesBestEffort(uploadedFiles);
      throw error;
    }
  }

  async createImageAssets(
    tx: Prisma.TransactionClient,
    ownerId: string,
    uploadedFiles: UploadedMediaFile[],
  ): Promise<MediaAsset[]> {
    const assets: MediaAsset[] = [];

    for (const uploadedFile of uploadedFiles) {
      const asset = await tx.mediaAsset.create({
        data: this.toImageAssetCreateData(ownerId, uploadedFile),
      });

      assets.push(asset);
    }

    return assets;
  }

  toImageAssetCreateData(ownerId: string, uploadedFile: UploadedMediaFile): Prisma.MediaAssetCreateInput {
    return {
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
    };
  }

  async deleteAssetRows(tx: Prisma.TransactionClient, assets: Array<Pick<MediaAsset, "id">>): Promise<void> {
    if (assets.length === 0) {
      return;
    }

    await tx.mediaAsset.deleteMany({
      where: {
        id: {
          in: assets.map((asset) => asset.id),
        },
      },
    });
  }

  async deleteStorageFilesBestEffort(files: StoredMediaFile[]): Promise<void> {
    const results = await Promise.allSettled(
      files.map((file) => this.cloudinaryMediaService.deleteFile(file.storageKey)),
    );

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        return;
      }

      const file = files[index];
      const label = file?.id ?? file?.storageKey ?? "unknown";

      this.loggingService.error(
        MediaAssetsService.name,
        `Best-effort Cloudinary deletion failed for media ${label}`,
        result.reason instanceof Error ? result.reason.stack : undefined,
      );
    });
  }
}
