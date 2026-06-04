"use client";

import type { PostImageDto } from "@social/contracts";
import { useState } from "react";

import { cn } from "#/shared/lib/utils";

import { PostImage } from "./post-image";
import { PostImageLightbox } from "./post-image-lightbox";

type PostImageGalleryProps = {
  className?: string;
  images: PostImageDto[];
};

const getImageFrameClassName = (imageCount: number, index: number) => {
  if (imageCount === 1) {
    return "aspect-[16/10]";
  }

  if (imageCount === 3) {
    // Fixed-height two-row grid: the first frame spans both rows while the two
    // right-hand frames fill their row track. They must not be `aspect-square`,
    // which would size them to the column width and overflow/overlap the grid.
    return index === 0 ? "row-span-2" : "h-full";
  }

  return "aspect-square";
};

const getGalleryClassName = (imageCount: number) => {
  if (imageCount === 1) {
    return "grid";
  }

  if (imageCount === 3) {
    return "grid h-72 grid-cols-2 grid-rows-2 gap-2 sm:h-80";
  }

  return "grid grid-cols-2 gap-2";
};

export const PostImageGallery = ({ className, images }: PostImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>();

  if (images.length === 0) {
    return null;
  }

  const selectedImage = selectedImageIndex === undefined ? undefined : images[selectedImageIndex];
  const closeImageViewer = () => setSelectedImageIndex(undefined);

  return (
    <>
      <div className={cn(getGalleryClassName(images.length), className)} aria-label="Post images" role="group">
        {images.map((image, index) => (
          <button
            aria-label={`Open post image ${index + 1}`}
            className={cn(
              "relative overflow-hidden rounded-lg border border-line bg-subtle-surface p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              getImageFrameClassName(images.length, index),
            )}
            key={image.id}
            onClick={() => setSelectedImageIndex(index)}
            type="button"
          >
            <PostImage
              alt={`Post image ${index + 1}`}
              sizes={images.length === 1 ? "(min-width: 768px) 640px, 100vw" : "(min-width: 768px) 320px, 50vw"}
              src={image.imageUrl}
            />
          </button>
        ))}
      </div>

      <PostImageLightbox image={selectedImage} index={selectedImageIndex ?? 0} onClose={closeImageViewer} />
    </>
  );
};
