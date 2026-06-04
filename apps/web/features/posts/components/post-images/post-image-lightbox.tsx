"use client";

import type { PostImageDto } from "@social/contracts";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

import { useBodyScrollLock } from "#/shared/hooks/use-body-scroll-lock";

import { PostImage } from "./post-image";

type PostImageLightboxProps = {
  image: PostImageDto | undefined;
  index: number;
  onClose: () => void;
};

export const PostImageLightbox = ({ image, index, onClose }: PostImageLightboxProps) => {
  const isOpen = !!image;

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!image) {
    return null;
  }

  const label = `Post image ${index + 1}`;

  return createPortal(
    <div
      aria-label={label}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-text/50 p-4 sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <button
        aria-label="Close image viewer"
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-text/40 text-on-primary outline-none transition-colors hover:bg-text/60 focus-visible:ring-2 focus-visible:ring-on-primary/60"
        onClick={onClose}
        type="button"
      >
        <X aria-hidden className="h-5 w-5" />
      </button>
      <div className="relative h-[90vh] w-[90vw]">
        <PostImage alt={`${label} full view`} fit="contain" sizes="90vw" src={image.imageUrl} />
      </div>
    </div>,
    document.body,
  );
};
