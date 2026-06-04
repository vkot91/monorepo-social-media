import { Injectable } from "@nestjs/common";
import type { PostImageOrderItemInput } from "@social/contracts";
import { type MediaAsset, type Prisma } from "@social/database";

import {
  assertMediaAssetsAttachableToPost,
  getRemovedPostImageAssets,
  type SubmittedMediaAsset,
} from "../helpers/post-image-attachment.helpers";
import { validatePostImageOrderInput } from "../inputs/post-image-input.validator";
import { MediaAssetsService } from "./media-assets.service";

type CurrentPostImage = Prisma.PostImageGetPayload<{
  include: {
    mediaAsset: true;
  };
}>;

@Injectable()
export class PostImagesService {
  constructor(private readonly mediaAssetsService: MediaAssetsService) {}

  /**
   * Replaces a post's image set inside an existing transaction.
   * The returned assets have already been removed from the DB and can be
   * cleaned up from external storage after the outer transaction commits.
   */
  async replaceImages(
    tx: Prisma.TransactionClient,
    ownerId: string,
    postId: string,
    imageOrder: PostImageOrderItemInput[],
    uploadedAssets: MediaAsset[],
  ): Promise<MediaAsset[]> {
    validatePostImageOrderInput(imageOrder, uploadedAssets.length);

    const existingMediaAssetIds = imageOrder.flatMap((image) => (image.type === "existing" ? [image.id] : []));
    const mediaAssetIds = imageOrder.map((image) =>
      image.type === "existing" ? image.id : uploadedAssets[image.fileIndex]!.id,
    );
    const currentImages = await this.getCurrentPostImages(tx, postId);
    const removedAssets = getRemovedPostImageAssets(currentImages, mediaAssetIds);

    await this.lockMediaAssets(tx, existingMediaAssetIds);
    await this.assertRetainableMediaAssets(tx, ownerId, postId, existingMediaAssetIds);
    await this.replacePostImages(tx, postId, mediaAssetIds);
    await this.mediaAssetsService.deleteAssetRows(tx, removedAssets);

    return removedAssets;
  }

  private getCurrentPostImages(tx: Prisma.TransactionClient, postId: string): Promise<CurrentPostImage[]> {
    return tx.postImage.findMany({
      include: {
        mediaAsset: true,
      },
      where: {
        postId,
      },
    });
  }

  private async lockMediaAssets(tx: Prisma.TransactionClient, mediaAssetIds: string[]): Promise<void> {
    if (mediaAssetIds.length === 0) {
      return;
    }

    await tx.$queryRawUnsafe('SELECT "id" FROM "media_assets" WHERE "id" = ANY($1::uuid[]) FOR UPDATE', mediaAssetIds);
  }

  private loadExistingMediaAssets(
    tx: Prisma.TransactionClient,
    mediaAssetIds: string[],
  ): Promise<SubmittedMediaAsset[]> {
    return tx.mediaAsset.findMany({
      include: {
        postImage: {
          select: {
            postId: true,
          },
        },
      },
      where: {
        id: {
          in: mediaAssetIds,
        },
      },
    });
  }

  private async assertRetainableMediaAssets(
    tx: Prisma.TransactionClient,
    ownerId: string,
    postId: string,
    mediaAssetIds: string[],
  ): Promise<void> {
    if (mediaAssetIds.length === 0) {
      return;
    }

    const mediaAssets = await this.loadExistingMediaAssets(tx, mediaAssetIds);

    assertMediaAssetsAttachableToPost(mediaAssetIds, mediaAssets, ownerId, postId);
  }

  private async replacePostImages(
    tx: Prisma.TransactionClient,
    postId: string,
    mediaAssetIds: string[],
  ): Promise<void> {
    await tx.postImage.deleteMany({
      where: {
        postId,
      },
    });

    if (mediaAssetIds.length === 0) {
      return;
    }

    await tx.postImage.createMany({
      data: mediaAssetIds.map((mediaAssetId, position) => ({
        mediaAssetId,
        position,
        postId,
      })),
    });
  }
}
