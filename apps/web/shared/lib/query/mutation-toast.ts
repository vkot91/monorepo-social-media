import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { ToastPosition, ToastTtl, useToastStore } from "#/shared/ui/toast/store/toast";

export interface MutationToastMeta extends Record<string, unknown> {
  toastOnError?: boolean;
  toastErrorMessage?: string;
  toastErrorTitle?: string;
  toastPosition?: ToastPosition;
  toastTtl?: ToastTtl;
  toastAutoClose?: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    mutationMeta: MutationToastMeta;
  }
}

const fallbackMutationErrorMessage = "Something went wrong. Try again.";

export const getMutationErrorToastMessage = (error: unknown, meta?: MutationToastMeta | null) => {
  if (typeof meta?.toastErrorMessage === "string" && meta.toastErrorMessage.length > 0) {
    return meta.toastErrorMessage;
  }

  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallbackMutationErrorMessage;
};

export const showMutationErrorToast = (error: unknown, meta?: MutationToastMeta | null) => {
  if (meta?.toastOnError === false) {
    return;
  }

  useToastStore.getState().addToast({
    autoClose: meta?.toastAutoClose,
    description: getMutationErrorToastMessage(error, meta),
    position: meta?.toastPosition,
    title: meta?.toastErrorTitle,
    ttl: meta?.toastTtl,
    type: "error",
  });
};
