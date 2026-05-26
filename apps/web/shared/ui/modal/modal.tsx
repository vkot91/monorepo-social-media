"use client";

import { X } from "lucide-react";
import { type ReactNode, useEffect, useId } from "react";
import { createPortal } from "react-dom";

import { cn } from "#/shared/lib/utils";
import { Button } from "#/shared/ui/button";

type ModalProps = {
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  description?: string;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  title: string;
};

let openModalCount = 0;
let previousBodyOverflow: string | null = null;

const lockBodyScroll = () => {
  if (openModalCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }

  openModalCount += 1;
};

const unlockBodyScroll = () => {
  openModalCount = Math.max(0, openModalCount - 1);

  if (openModalCount === 0) {
    document.body.style.overflow = previousBodyOverflow ?? "";
    previousBodyOverflow = null;
  }
};

export const Modal = ({
  children,
  className,
  closeLabel = "Close dialog",
  description,
  footer,
  onOpenChange,
  open,
  title,
}: ModalProps) => {
  const descriptionId = useId();
  const titleId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-text/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onOpenChange(false);
        }
      }}
      role="dialog"
    >
      <div
        className={cn("grid w-full max-w-lg gap-5 rounded-2xl border border-line bg-surface p-6 shadow-2xl", className)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            <h2 className="m-0 text-xl font-extrabold" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="m-0 text-sm text-muted-text" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <Button
            aria-label={closeLabel}
            className="h-9 w-9 shrink-0 p-0"
            onClick={() => onOpenChange(false)}
            variant="ghost"
          >
            <X aria-hidden className="h-4 w-4" />
          </Button>
        </div>
        <div>{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
};
