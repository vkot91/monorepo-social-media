import { useMutation } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { ToastViewport } from "#/shared/ui";
import { useToastStore } from "#/shared/ui/toast/store/toast";

import { QueryProvider } from "./query-provider";

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

const renderQueryProvider = (children: ReactNode) =>
  render(
    <QueryProvider>
      {children}
      <ToastViewport />
    </QueryProvider>,
  );

describe("QueryProvider", () => {
  afterEach(() => {
    act(() => {
      useToastStore.getState().clearToasts();
    });
    vi.useRealTimers();
  });

  describe("401 handling in mutations", () => {
    beforeEach(() => {
      vi.spyOn(window, "location", "get").mockReturnValue({
        ...window.location,
        href: "",
      } as Location);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("redirects to login and suppresses toast when a private mutation gets a 401", async () => {
      const locationMock = { href: "" };
      vi.spyOn(window, "location", "get").mockReturnValue(locationMock as unknown as Location);

      renderQueryProvider(
        <FailingMutationButton error={new ApiRequestError("Unauthorized", 401)} />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /fail mutation/i }));
      });

      await waitFor(() => {
        expect(locationMock.href).toBe("/login");
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows an error toast and does not redirect when a public mutation gets a 401", async () => {
      const locationMock = { href: "" };
      vi.spyOn(window, "location", "get").mockReturnValue(locationMock as unknown as Location);

      renderQueryProvider(
        <FailingMutationButton
          error={new ApiRequestError("Invalid credentials", 401)}
          meta={{ isPublicEndpoint: true }}
        />,
      );

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /fail mutation/i }));
      });

      expect(await screen.findByRole("alert")).toHaveTextContent("Invalid credentials");
      expect(locationMock.href).toBe("");
    });
  });

  it("shows an API error toast when a mutation fails", async () => {
    renderQueryProvider(<FailingMutationButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /fail mutation/i }));
    });

    expect(await screen.findByRole("alert")).toHaveTextContent("The request failed");
  });

  it("does not show an error toast when mutation meta disables it", async () => {
    renderQueryProvider(
      <FailingMutationButton
        meta={{
          toastOnError: false,
        }}
      />,
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
    renderQueryProvider(
      <FailingMutationButton
        error={new Error("Original failure")}
        meta={{
          toastAutoClose: false,
          toastErrorMessage: "Custom failure",
          toastErrorTitle: "Could not save changes",
          toastPosition: "bottom-right",
          toastTtl: 8_000,
        }}
      />,
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
});
