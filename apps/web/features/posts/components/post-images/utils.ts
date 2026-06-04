import {
  POST_IMAGE_ALLOWED_MIME_TYPES,
  POST_IMAGE_MAX_COUNT,
  POST_IMAGE_MAX_SIZE_BYTES,
  POST_IMAGE_OPTIMIZED_REMOTE_HOSTS,
} from "./constants";
import type { LocalManagedPostImage, ManagedPostImage } from "./types";

export const createLocalImageId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export const isLocalImage = (image: ManagedPostImage): image is LocalManagedPostImage => image.kind === "local";

export const getManagedImageUrl = (image: ManagedPostImage) => (isLocalImage(image) ? image.previewUrl : image.imageUrl);

export const getManagedImageDescription = (image: ManagedPostImage, index: number) =>
  isLocalImage(image) ? `${image.file.name}, image ${index + 1}` : `Existing image ${index + 1}`;

export const isOptimizablePostImageUrl = (src: string) => {
  try {
    const hostname = new URL(src).hostname as (typeof POST_IMAGE_OPTIMIZED_REMOTE_HOSTS)[number];

    return POST_IMAGE_OPTIMIZED_REMOTE_HOSTS.includes(hostname);
  } catch {
    return false;
  }
};

export const getPostImageSelectionError = (currentImageCount: number, selectedFiles: File[]) => {
  if (currentImageCount + selectedFiles.length > POST_IMAGE_MAX_COUNT) {
    return `You can add up to ${POST_IMAGE_MAX_COUNT} images.`;
  }

  const invalidTypeFile = selectedFiles.find((file) => !POST_IMAGE_ALLOWED_MIME_TYPES.has(file.type));

  if (invalidTypeFile) {
    return `${invalidTypeFile.name} must be a JPG, PNG, or WebP image.`;
  }

  const oversizedFile = selectedFiles.find((file) => file.size > POST_IMAGE_MAX_SIZE_BYTES);

  if (oversizedFile) {
    return `${oversizedFile.name} must be 5 MB or smaller.`;
  }

  return undefined;
};
