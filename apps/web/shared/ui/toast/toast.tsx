"use client";

import { cva } from "class-variance-authority";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useEffect } from "react";

import { cn } from "#/shared/lib/utils";
import { Toast, ToastPosition, ToastTtl, ToastType, useToastStore } from "#/shared/ui/toast/store/toast";

import { Button } from "../button";

const toastPositions: ToastPosition[] = [
  "top-right",
  "top-left",
  "top-center",
  "bottom-right",
  "bottom-left",
  "bottom-center",
];

const toastViewportVariants = cva(
  "pointer-events-none fixed z-50 flex w-[min(calc(100vw-2rem),24rem)] flex-col gap-3",
  {
    variants: {
      position: {
        "top-right": "right-4 top-4 items-end",
        "top-left": "left-4 top-4 items-start",
        "top-center": "left-1/2 top-4 -translate-x-1/2 items-center",
        "bottom-right": "bottom-4 right-4 items-end",
        "bottom-left": "bottom-4 left-4 items-start",
        "bottom-center": "bottom-4 left-1/2 -translate-x-1/2 items-center",
      },
    },
  },
);

const toastVariants = cva(
  "pointer-events-auto relative grid w-full grid-cols-[auto_1fr_auto] gap-3 overflow-hidden rounded-lg border bg-surface p-4 text-sm text-text shadow-2xl shadow-text/10",
  {
    variants: {
      type: {
        success: "border-success/40",
        error: "border-danger/45",
        warning: "border-warning/45",
        info: "border-primary/40",
      },
    },
  },
);

const toastIconVariants = cva("mt-0.5 h-5 w-5 shrink-0", {
  variants: {
    type: {
      success: "text-success",
      error: "text-danger",
      warning: "text-warning",
      info: "text-primary",
    },
  },
});

type ToastProgressDuration = `${ToastTtl}`;

const getToastProgressDuration = (ttl: ToastTtl): ToastProgressDuration => {
  return `${ttl}` as ToastProgressDuration;
};

const toastProgressVariants = cva("h-full origin-left motion-reduce:animate-none", {
  variants: {
    type: {
      success: "bg-success",
      error: "bg-danger",
      warning: "bg-warning",
      info: "bg-primary",
    },
    duration: {
      "1000": "animate-[toast-progress_1000ms_linear_forwards]",
      "2000": "animate-[toast-progress_2000ms_linear_forwards]",
      "3000": "animate-[toast-progress_3000ms_linear_forwards]",
      "4000": "animate-[toast-progress_4000ms_linear_forwards]",
      "5000": "animate-[toast-progress_5000ms_linear_forwards]",
      "8000": "animate-[toast-progress_8000ms_linear_forwards]",
      "10000": "animate-[toast-progress_10000ms_linear_forwards]",
    },
  },
});

const toastIcons = {
  success: CircleCheck,
  error: CircleAlert,
  warning: TriangleAlert,
  info: Info,
} satisfies Record<ToastType, typeof Info>;

const ToastItem = ({ toast }: { toast: Toast }) => {
  const dismissToast = useToastStore((state) => state.dismissToast);
  const Icon = toastIcons[toast.type];

  useEffect(() => {
    if (!toast.autoClose) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      dismissToast(toast.id);
    }, toast.ttl);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [dismissToast, toast.autoClose, toast.id, toast.ttl]);

  return (
    <li
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      className={toastVariants({ type: toast.type })}
      role={toast.type === "error" ? "alert" : "status"}
    >
      <Icon aria-hidden className={toastIconVariants({ type: toast.type })} />
      <div className="min-w-0">
        {toast.title && <p className="m-0 font-extrabold leading-5">{toast.title}</p>}
        <p className={cn("m-0 leading-5 text-muted-text", toast.title && "mt-1")}>{toast.description}</p>
      </div>
      <Button aria-label="Dismiss toast" variant="ghost" size="sm" onClick={() => dismissToast(toast.id)} type="button">
        <X aria-hidden className="h-4 w-4" />
      </Button>
      {toast.autoClose && (
        <div aria-hidden className="absolute bottom-0 left-0 h-1 w-full bg-subtle-surface">
          <div
            className={toastProgressVariants({
              duration: getToastProgressDuration(toast.ttl),
              type: toast.type,
            })}
            data-testid="toast-progress"
          />
        </div>
      )}
    </li>
  );
};

export const ToastViewport = () => {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <>
      {toastPositions.map((position) => {
        const positionedToasts = toasts.filter((toast) => toast.position === position);

        if (positionedToasts.length === 0) {
          return null;
        }

        return (
          <ol
            aria-label={`${position.replace("-", " ")} notifications`}
            className={toastViewportVariants({ position })}
            key={position}
          >
            {positionedToasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} />
            ))}
          </ol>
        );
      })}
    </>
  );
};
