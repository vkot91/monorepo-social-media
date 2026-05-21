import { afterEach, describe, expect, it, vi } from "vitest";

import { defaultToastOptions, useToastStore } from "./toast";

describe("useToastStore", () => {
  afterEach(() => {
    useToastStore.getState().clearToasts();
    vi.useRealTimers();
  });

  it("normalizes missing toast options with defaults", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-21T12:00:00.000Z"));

    const id = useToastStore.getState().addToast({
      description: "Saved",
    });

    expect(useToastStore.getState().toasts).toEqual([
      {
        ...defaultToastOptions,
        createdAt: Date.parse("2026-05-21T12:00:00.000Z"),
        description: "Saved",
        id,
        title: undefined,
      },
    ]);
  });

  it("adds multiple toasts with the newest toast first", () => {
    useToastStore.getState().addToast({
      description: "First",
      id: "first",
    });
    useToastStore.getState().addToast({
      description: "Second",
      id: "second",
      type: "success",
    });

    expect(useToastStore.getState().toasts.map((toast) => toast.id)).toEqual(["second", "first"]);
  });

  it("dismisses one toast by id", () => {
    useToastStore.getState().addToast({
      description: "Keep",
      id: "keep",
    });
    useToastStore.getState().addToast({
      description: "Dismiss",
      id: "dismiss",
    });

    useToastStore.getState().dismissToast("dismiss");

    expect(useToastStore.getState().toasts.map((toast) => toast.id)).toEqual(["keep"]);
  });

  it("clears every toast", () => {
    useToastStore.getState().addToast({
      description: "First",
    });
    useToastStore.getState().addToast({
      description: "Second",
    });

    useToastStore.getState().clearToasts();

    expect(useToastStore.getState().toasts).toEqual([]);
  });
});
