import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useToastStore } from "#/shared/ui/toast/store/toast";

import { ToastViewport } from "./toast";

describe("ToastViewport", () => {
  afterEach(() => {
    act(() => {
      useToastStore.getState().clearToasts();
    });
    vi.useRealTimers();
  });

  it("renders an error toast with an alert role", () => {
    useToastStore.getState().addToast({
      autoClose: false,
      description: "Could not save changes",
      id: "save-error",
      title: "Save failed",
      type: "error",
    });

    render(<ToastViewport />);

    expect(screen.getByRole("alert")).toHaveTextContent("Save failed");
    expect(screen.getByRole("alert")).toHaveTextContent("Could not save changes");
  });

  it("renders multiple toasts as a newest-first stack", () => {
    useToastStore.getState().addToast({
      autoClose: false,
      description: "First",
      id: "first",
    });
    useToastStore.getState().addToast({
      autoClose: false,
      description: "Second",
      id: "second",
    });

    render(<ToastViewport />);

    expect(screen.getAllByRole("status").map((toast) => toast.textContent)).toEqual([
      expect.stringContaining("Second"),
      expect.stringContaining("First"),
    ]);
  });

  it("dismisses a toast from the close button", () => {
    useToastStore.getState().addToast({
      autoClose: false,
      description: "Dismiss me",
      id: "dismiss-me",
    });

    render(<ToastViewport />);

    fireEvent.click(screen.getByRole("button", { name: /dismiss toast/i }));

    expect(screen.queryByText("Dismiss me")).not.toBeInTheDocument();
  });

  it("auto-closes a toast after its ttl", () => {
    vi.useFakeTimers();
    useToastStore.getState().addToast({
      description: "Temporary",
      id: "temporary",
      ttl: 1_000,
    });

    render(<ToastViewport />);

    expect(screen.getByTestId("toast-progress")).toHaveClass("animate-[toast-progress_1000ms_linear_forwards]");
    expect(screen.getByTestId("toast-progress")).not.toHaveAttribute("style");

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(screen.queryByText("Temporary")).not.toBeInTheDocument();
  });

  it("keeps a toast visible when autoClose is false", () => {
    vi.useFakeTimers();
    useToastStore.getState().addToast({
      autoClose: false,
      description: "Persistent",
      id: "persistent",
      ttl: 1_000,
    });

    render(<ToastViewport />);

    expect(screen.queryByTestId("toast-progress")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(screen.getByText("Persistent")).toBeInTheDocument();
  });
});
