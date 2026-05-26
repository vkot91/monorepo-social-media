import { create } from "zustand";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastPosition = "top-right" | "top-left" | "top-center" | "bottom-right" | "bottom-left" | "bottom-center";

export const toastTtlOptions = [1_000, 2_000, 3_000, 4_000, 5_000, 8_000, 10_000] as const;

export type ToastTtl = (typeof toastTtlOptions)[number];

export type ToastOptions = {
  title?: string;
  description: string;
  type?: ToastType;
  position?: ToastPosition;
  ttl?: ToastTtl;
  autoClose?: boolean;
};

export type Toast = Required<Omit<ToastOptions, "title">> & {
  id: string;
  title?: string;
  createdAt: number;
};

export type AddToastOptions = ToastOptions & {
  id?: string;
};

type ToastStore = {
  toasts: Toast[];
  addToast: (toast: AddToastOptions) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

export const defaultToastOptions = {
  autoClose: true,
  position: "top-right",
  ttl: 5_000,
  type: "info",
} as const satisfies Required<Pick<ToastOptions, "autoClose" | "position" | "ttl" | "type">>;

let nextToastId = 0;

const createToast = ({ id, ...toast }: AddToastOptions): Toast => {
  const toastId = id ?? `toast-${Date.now()}-${nextToastId++}`;

  return {
    autoClose: toast.autoClose ?? defaultToastOptions.autoClose,
    createdAt: Date.now(),
    description: toast.description,
    id: toastId,
    position: toast.position ?? defaultToastOptions.position,
    title: toast.title,
    ttl: toast.ttl ?? defaultToastOptions.ttl,
    type: toast.type ?? defaultToastOptions.type,
  };
};

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const normalizedToast = createToast(toast);

    set((state) => ({
      toasts: [normalizedToast, ...state.toasts],
    }));

    return normalizedToast.id;
  },
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
  clearToasts: () =>
    set({
      toasts: [],
    }),
}));
