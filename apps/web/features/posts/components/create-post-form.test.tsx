import type { PostDto } from "@social/contracts";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { createTestQueryClient } from "#/test/query-client";

import { postsKeys } from "../api/routes";
import { CreatePostForm } from "./create-post-form";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

const createdPost: PostDto = {
  author: {
    avatarUrl: null,
    displayName: "Maya Johnson",
    id: "author-1",
    username: "maya",
  },
  content: "Created post content.",
  createdAt: "2026-05-08T10:00:00.000Z",
  id: "post-2",
  imageUrl: null,
  updatedAt: "2026-05-08T10:00:00.000Z",
  visibility: "PUBLIC",
};

const renderWithClient = (ui: ReactElement) => {
  const queryClient = createTestQueryClient();

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
};

describe("CreatePostForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a post, resets the form, and refreshes the feed", async () => {
    const { queryClient } = renderWithClient(<CreatePostForm />);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    vi.mocked(bffClient).mockResolvedValueOnce(createdPost);

    fireEvent.change(screen.getByLabelText(/create post/i), {
      target: {
        value: "Created post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^post$/i }));

    await waitFor(() =>
      expect(bffClient).toHaveBeenCalledWith("/api/posts", "POST", {
        body: {
          content: "Created post content.",
          imageUrl: null,
          visibility: "PUBLIC",
        },
      }),
    );
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: postsKeys.infiniteFeedRoot,
      }),
    );
    expect(screen.getByLabelText(/create post/i)).toHaveValue("");
  });

  it("stops submit loading after create resolves while the feed refresh continues", async () => {
    const { queryClient } = renderWithClient(<CreatePostForm />);
    let resolveCreate: (value: PostDto) => void = () => undefined;

    vi.mocked(bffClient).mockReturnValueOnce(
      new Promise<PostDto>((resolve) => {
        resolveCreate = resolve;
      }),
    );
    vi.spyOn(queryClient, "invalidateQueries").mockReturnValue(new Promise(() => undefined));

    fireEvent.change(screen.getByLabelText(/create post/i), {
      target: {
        value: "Created post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^post$/i }));

    const submitButton = screen.getByRole("button", { name: /^post$/i });

    await waitFor(() => expect(submitButton).toHaveAttribute("aria-busy", "true"));

    await act(async () => {
      resolveCreate(createdPost);
    });

    await waitFor(() => expect(submitButton).not.toHaveAttribute("aria-busy"));
  });

  it("restores submitted content when creation fails", async () => {
    renderWithClient(<CreatePostForm />);
    vi.mocked(bffClient).mockRejectedValueOnce(
      new ApiRequestError("Could not create post", 422, {
        content: ["Post content is invalid"],
      }),
    );

    fireEvent.change(screen.getByLabelText(/create post/i), {
      target: {
        value: "Rejected post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^post$/i }));

    expect(await screen.findByText("Post content is invalid")).toBeInTheDocument();
    expect(screen.getByLabelText(/create post/i)).toHaveValue("Rejected post content.");
  });
});
