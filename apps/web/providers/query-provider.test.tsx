import { useMutation } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useToastStore } from "#/components/ui/toast/store/toast";
import { ApiRequestError } from "#/lib/api/utils/errors";

import { QueryProvider, shouldRetryQuery } from "./query-provider";

const FailingMutationButton = ({
  error = new ApiRequestError("The request failed", 422),
  meta,
}: {
  error?: unknown;
  meta?: Parameters<typeof useMutation<void, unknown, void>>[0]["meta"];
}) => {
  const mutation = useMutation({
    meta,
    mutationFn: async () => {
      throw error;
    },
  });

  return (
    <button onClick={() => mutation.mutate()} type="button">
      Fail mutation
    </button>
  );
};

describe("QueryProvider", () => {
  afterEach(() => {
    act(() => {
      useToastStore.getState().clearToasts();
    });
    vi.useRealTimers();
  });

  it("shows an API error toast when a mutation fails", async () => {
    render(
      <QueryProvider>
        <FailingMutationButton />
      </QueryProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /fail mutation/i }));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("The request failed");
  });

  it("does not show an error toast when mutation meta disables it", async () => {
    render(
      <QueryProvider>
        <FailingMutationButton
          meta={{
            toastOnError: false,
          }}
        />
      </QueryProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /fail mutation/i }));
    });

    await waitFor(() => {
      expect(useToastStore.getState().toasts).toEqual([]);
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("uses custom mutation toast metadata", async () => {
    render(
      <QueryProvider>
        <FailingMutationButton
          error={new Error("Original failure")}
          meta={{
            toastAutoClose: false,
            toastErrorMessage: "Custom failure",
            toastErrorTitle: "Could not save changes",
            toastPosition: "bottom-right",
            toastTtl: 8_000,
          }}
        />
      </QueryProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /fail mutation/i }));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not save changes");
    expect(screen.getByRole("alert")).toHaveTextContent("Custom failure");
    expect(screen.getByLabelText("bottom right notifications")).toBeInTheDocument();
    expect(useToastStore.getState().toasts[0]).toMatchObject({
      autoClose: false,
      position: "bottom-right",
      ttl: 8_000,
      type: "error",
    });
  });

  it("does not retry API response errors from BFF routes", () => {
    expect(shouldRetryQuery(0, new ApiRequestError("Feed is unavailable", 503))).toBe(false);
  });

  it("retries non-API query failures up to the configured limit", () => {
    expect(shouldRetryQuery(0, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetryQuery(2, new TypeError("Failed to fetch"))).toBe(true);
    expect(shouldRetryQuery(3, new TypeError("Failed to fetch"))).toBe(false);
  });
});
