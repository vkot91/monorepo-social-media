import { BadRequestException } from "@nestjs/common";
import type { PostImageOrderItemInput } from "@social/contracts";

export const maxPostImages = 4;

export const validatePostImageOrderInput = (
  imageOrder: PostImageOrderItemInput[],
  uploadedFileCount: number,
): void => {
  if (imageOrder.length > maxPostImages) {
    throw new BadRequestException(`Posts can include at most ${maxPostImages} images`);
  }

  const existingMediaAssetIds = imageOrder
    .filter((image): image is Extract<PostImageOrderItemInput, { type: "existing" }> => image.type === "existing")
    .map((image) => image.id);
  const uniqueExistingMediaAssetIds = new Set(existingMediaAssetIds);

  if (uniqueExistingMediaAssetIds.size !== existingMediaAssetIds.length) {
    throw new BadRequestException("Duplicate media assets are not allowed");
  }
  const uploadFileIndexes = imageOrder
    .filter((image): image is Extract<PostImageOrderItemInput, { type: "upload" }> => image.type === "upload")
    .map((image) => image.fileIndex);
  const uniqueUploadFileIndexes = new Set(uploadFileIndexes);

  if (uniqueUploadFileIndexes.size !== uploadFileIndexes.length) {
    throw new BadRequestException("Duplicate uploaded images are not allowed");
  }

  if (uploadFileIndexes.length !== uploadedFileCount) {
    throw new BadRequestException("Every uploaded image must be included in imageOrder");
  }

  if (uploadFileIndexes.some((fileIndex) => fileIndex >= uploadedFileCount)) {
    throw new BadRequestException("One or more uploaded image references are invalid");
  }
};
