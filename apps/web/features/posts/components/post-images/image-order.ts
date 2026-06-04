import type { PostImageDto, PostImageOrderItemInput } from "@social/contracts";

import type { ManagedPostImage } from "./types";
import { isLocalImage } from "./utils";

export const mapPostImagesToManaged = (images: PostImageDto[]): ManagedPostImage[] =>
  images.map((image) => ({
    id: image.id,
    imageId: image.imageId,
    imageUrl: image.imageUrl,
    kind: "existing",
  }));

export const haveManagedImagesChanged = (initial: PostImageDto[], current: ManagedPostImage[]) => {
  if (initial.length !== current.length) {
    return true;
  }

  return current.some((image, index) => image.id !== initial[index]?.id);
};

export type UpdateImagePayload = {
  files: File[];
  imageOrder: PostImageOrderItemInput[];
};

export const buildUpdateImagePayload = (images: ManagedPostImage[]): UpdateImagePayload => {
  const files: File[] = [];

  const imageOrder = images.map<PostImageOrderItemInput>((image) => {
    if (isLocalImage(image)) {
      const fileIndex = files.length;

      files.push(image.file);

      return { fileIndex, type: "upload" };
    }

    return { id: image.id, type: "existing" };
  });

  return { files, imageOrder };
};
