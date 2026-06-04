import { BadRequestException } from "@nestjs/common";
import { MediaAssetKind, type Prisma } from "@social/database";

type CurrentPostImage = Prisma.PostImageGetPayload<{
  include: {
    mediaAsset: true;
  };
}>;

export type SubmittedMediaAsset = Prisma.MediaAssetGetPayload<{
  include: {
    postImage: {
      select: {
        postId: true;
      };
    };
  };
}>;

export const getRemovedPostImageAssets = (
  currentImages: CurrentPostImage[],
  incomingMediaAssetIds: string[],
) => {
  const incomingMediaAssetIdSet = new Set(incomingMediaAssetIds);

  return currentImages
    .filter((image) => !incomingMediaAssetIdSet.has(image.mediaAssetId))
    .map((image) => image.mediaAsset);
};

export const isMediaAssetAttachableToPost = (
  asset: SubmittedMediaAsset,
  postId: string,
): boolean => {
  return asset.postImage?.postId === postId;
};

export const assertMediaAssetsAttachableToPost = (
  mediaAssetIds: string[],
  mediaAssets: SubmittedMediaAsset[],
  ownerId: string,
  postId: string,
) => {
  const mediaAssetById = new Map(mediaAssets.map((asset) => [asset.id, asset]));

  for (const mediaAssetId of mediaAssetIds) {
    const asset = mediaAssetById.get(mediaAssetId);

    if (!asset || asset.ownerId !== ownerId || asset.kind !== MediaAssetKind.IMAGE) {
      throw new BadRequestException("One or more media assets are invalid");
    }

    if (!isMediaAssetAttachableToPost(asset, postId)) {
      throw new BadRequestException("One or more media assets are not attached to this post");
    }
  }
};
