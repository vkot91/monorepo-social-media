"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, rectSortingStrategy, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { ImagePlus } from "lucide-react";
import { type ChangeEvent, useEffect, useId, useRef, useState } from "react";

import { cn } from "#/shared/lib/utils";
import { Button } from "#/shared/ui/button";
import { FieldError } from "#/shared/ui/form";

import { POST_IMAGE_ACCEPT, POST_IMAGE_MAX_COUNT } from "./constants";
import { SortablePostImageItem } from "./sortable-post-image-item";
import type { ManagedPostImage } from "./types";
import { createLocalImageId, getPostImageSelectionError, isLocalImage } from "./utils";

type PostImageManagerProps = {
  className?: string;
  disabled?: boolean;
  images: ManagedPostImage[];
  label?: string;
  onChange: (images: ManagedPostImage[]) => void;
};

export const PostImageManager = ({
  className,
  disabled = false,
  images,
  label = "Post images",
  onChange,
}: PostImageManagerProps) => {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createdObjectUrlsRef = useRef(new Set<string>());
  const previousImagesRef = useRef(images);
  const [error, setError] = useState<string>();
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const revokeObjectUrl = (previewUrl: string) => {
    if (!createdObjectUrlsRef.current.delete(previewUrl)) {
      return;
    }

    URL.revokeObjectURL(previewUrl);
  };

  useEffect(() => {
    const currentLocalUrls = new Set(images.filter(isLocalImage).map((image) => image.previewUrl));

    previousImagesRef.current.filter(isLocalImage).forEach((image) => {
      if (!currentLocalUrls.has(image.previewUrl)) {
        revokeObjectUrl(image.previewUrl);
      }
    });

    previousImagesRef.current = images;
  }, [images]);

  useEffect(
    () => () => {
      createdObjectUrlsRef.current.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });
      createdObjectUrlsRef.current.clear();
    },
    [],
  );

  const addFiles = (fileList: FileList | null) => {
    const selectedFiles = Array.from(fileList ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    const selectionError = getPostImageSelectionError(images.length, selectedFiles);

    if (selectionError) {
      setError(selectionError);
      return;
    }

    const localImages = selectedFiles.map((file) => {
      const previewUrl = URL.createObjectURL(file);

      createdObjectUrlsRef.current.add(previewUrl);

      return {
        file,
        id: createLocalImageId(),
        kind: "local" as const,
        previewUrl,
      };
    });

    setError(undefined);
    onChange([...images, ...localImages]);
  };

  const onFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    addFiles(event.currentTarget.files);
    event.currentTarget.value = "";
  };

  const removeImage = (index: number) => {
    const image = images[index];

    if (!image) {
      return;
    }

    if (isLocalImage(image)) {
      revokeObjectUrl(image.previewUrl);
    }

    setError(undefined);
    onChange(images.filter((_, imageIndex) => imageIndex !== index));
  };

  const reorderImages = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) {
      return;
    }

    const fromIndex = images.findIndex((image) => image.id === active.id);
    const toIndex = images.findIndex((image) => image.id === over.id);

    if (fromIndex === -1 || toIndex === -1) {
      return;
    }

    setError(undefined);
    onChange(arrayMove(images, fromIndex, toIndex));
  };

  const canAddMoreImages = images.length < POST_IMAGE_MAX_COUNT;

  return (
    <section className={cn("grid gap-3", className)} aria-labelledby={inputId}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold" id={inputId}>
            {label}
          </h3>
          <p className="mt-1 text-sm text-muted-text">
            JPG, PNG, or WebP. Up to {POST_IMAGE_MAX_COUNT} images, 5 MB each.
          </p>
        </div>
        <input
          accept={POST_IMAGE_ACCEPT}
          aria-label="Choose post images"
          className="sr-only"
          disabled={disabled || !canAddMoreImages}
          multiple
          onChange={onFileInputChange}
          ref={fileInputRef}
          type="file"
        />
        <Button
          className="gap-2"
          disabled={disabled || !canAddMoreImages}
          onClick={() => fileInputRef.current?.click()}
          size="sm"
          variant="secondary"
        >
          <ImagePlus aria-hidden className="h-4 w-4" />
          Add images
        </Button>
      </div>

      <FieldError message={error} />

      {images.length > 0 ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={reorderImages} sensors={sensors}>
          <SortableContext items={images.map((image) => image.id)} strategy={rectSortingStrategy}>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((image, index) => (
                <SortablePostImageItem
                  disabled={disabled}
                  image={image}
                  index={index}
                  key={image.id}
                  onRemove={removeImage}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : null}
    </section>
  );
};
