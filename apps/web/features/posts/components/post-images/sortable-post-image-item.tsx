import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

import { cn } from "#/shared/lib/utils";
import { Button } from "#/shared/ui/button";

import { PostImage } from "./post-image";
import type { ManagedPostImage } from "./types";
import { getManagedImageDescription, getManagedImageUrl } from "./utils";

type SortablePostImageItemProps = {
  disabled: boolean;
  image: ManagedPostImage;
  index: number;
  onRemove: (index: number) => void;
};

export const SortablePostImageItem = ({ disabled, image, index, onRemove }: SortablePostImageItemProps) => {
  const imageNumber = index + 1;
  const imageLabel = `post image ${imageNumber}`;
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    disabled,
    id: image.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li className="grid gap-2" ref={setNodeRef} style={style}>
      <div
        className={cn(
          "group relative aspect-square overflow-hidden rounded-lg border border-line bg-subtle-surface",
          isDragging && "z-10 opacity-80 shadow-lg",
        )}
      >
        <PostImage
          alt={`Post image preview ${imageNumber}`}
          sizes="(min-width: 640px) 25vw, 50vw"
          src={getManagedImageUrl(image)}
        />
        <button
          aria-label={`Reorder ${imageLabel}`}
          className="absolute inset-0 flex cursor-grab items-center justify-center bg-text/0 text-on-primary opacity-0 outline-none transition-opacity active:cursor-grabbing group-hover:bg-text/20 group-hover:opacity-100 focus-visible:bg-text/20 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary/40"
          disabled={disabled}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden className="h-6 w-6 drop-shadow" />
        </button>
        <Button
          aria-label={`Remove ${imageLabel}`}
          className="absolute right-2 top-2 h-8 min-h-0 w-8 rounded-full p-0 shadow-sm"
          disabled={disabled}
          onClick={() => onRemove(index)}
          size="sm"
          variant="danger"
        >
          <X aria-hidden className="h-4 w-4" />
        </Button>
      </div>
      <span className="truncate text-xs font-bold text-muted-text">{getManagedImageDescription(image, index)}</span>
    </li>
  );
};
