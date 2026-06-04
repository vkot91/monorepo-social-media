import type { PostDto } from "@social/contracts";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { createTestQueryClient } from "#/test/query-client";

import type { PostsInfiniteData } from "../api/helpers/cache";
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
  images: [],
  updatedAt: "2026-05-08T10:00:00.000Z",
  visibility: "PUBLIC",
};

const createdPostWithImage: PostDto = {
  ...createdPost,
  images: [
    {
      id: "media-1",
      imageId: "posts/post-2/first",
      imageUrl: "https://example.com/first.jpg",
      position: 0,
    },
  ],
};

const createImageFile = (name: string, type = "image/jpeg") => new File(["image-content"], name, { type });

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
    vi.stubGlobal("URL", {
      ...URL,
      createObjectURL: vi.fn((file: File) => `blob:${file.name}`),
      revokeObjectURL: vi.fn(),
    });
  });

  it("creates a post, resets the form, refreshes the feed, and caches returned images", async () => {
    const { queryClient } = renderWithClient(<CreatePostForm />);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const feedKey = postsKeys.infiniteFeed({
      feed: "all",
      mode: "cursor",
    });

    queryClient.setQueryData<PostsInfiniteData>(feedKey, {
      pageParams: [null],
      pages: [
        {
          items: [],
          pageInfo: {
            hasNextPage: false,
            limit: 20,
            mode: "cursor",
            nextCursor: null,
          },
        },
      ],
    });
    vi.mocked(bffClient).mockResolvedValueOnce(createdPostWithImage);

    fireEvent.change(screen.getByLabelText(/create post/i), {
      target: {
        value: "Created post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^post$/i }));

    await waitFor(() => expect(bffClient).toHaveBeenCalled());

    const requestOptions = vi.mocked(bffClient).mock.calls[0]?.[2] as { body?: unknown } | undefined;
    const body = requestOptions?.body;

    expect(bffClient).toHaveBeenCalledWith("/api/posts", "POST", {
      body: expect.any(FormData),
    });
    expect(body).toBeInstanceOf(FormData);
    expect(body instanceof FormData ? body.get("content") : undefined).toBe("Created post content.");
    expect(body instanceof FormData ? body.get("visibility") : undefined).toBe("PUBLIC");
    expect(body instanceof FormData ? body.getAll("images") : undefined).toEqual([]);
    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: postsKeys.infiniteFeedRoot,
        refetchType: "active",
      }),
    );
    expect(screen.getByLabelText(/create post/i)).toHaveValue("");
    expect(queryClient.getQueryData<PostsInfiniteData>(feedKey)?.pages[0]?.items[0]?.images).toEqual(
      createdPostWithImage.images,
    );
  });

  it("keeps images outside React Hook Form and submits local files as repeated images", async () => {
    renderWithClient(<CreatePostForm />);
    const firstImage = createImageFile("first.jpg");
    const secondImage = createImageFile("second.webp", "image/webp");

    vi.mocked(bffClient).mockResolvedValueOnce(createdPost);

    fireEvent.change(screen.getByLabelText(/choose post images/i), {
      target: {
        files: [firstImage, secondImage],
      },
    });

    expect(bffClient).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^post$/i })).toBeEnabled();
    expect(screen.getByRole("img", { name: /post image preview 1/i })).toHaveAttribute("src", "blob:first.jpg");
    expect(screen.getByRole("img", { name: /post image preview 2/i })).toHaveAttribute("src", "blob:second.webp");

    fireEvent.change(screen.getByLabelText(/create post/i), {
      target: {
        value: "Created post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^post$/i }));

    await waitFor(() => expect(bffClient).toHaveBeenCalled());

    const requestOptions = vi.mocked(bffClient).mock.calls[0]?.[2] as { body?: unknown } | undefined;
    const body = requestOptions?.body;

    expect(body instanceof FormData ? body.getAll("images") : undefined).toEqual([firstImage, secondImage]);
    await waitFor(() =>
      expect(screen.queryByRole("img", { name: /post image preview 1/i })).not.toBeInTheDocument(),
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
    const { queryClient } = renderWithClient(<CreatePostForm />);
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");
    const selectedImage = createImageFile("first.jpg");

    vi.mocked(bffClient).mockRejectedValueOnce(
      new ApiRequestError("Could not create post", 422, {
        content: ["Post content is invalid"],
      }),
    );

    fireEvent.change(screen.getByLabelText(/choose post images/i), {
      target: {
        files: [selectedImage],
      },
    });
    fireEvent.change(screen.getByLabelText(/create post/i), {
      target: {
        value: "Rejected post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^post$/i }));

    expect(await screen.findByText("Post content is invalid")).toBeInTheDocument();
    expect(screen.getByLabelText(/create post/i)).toHaveValue("Rejected post content.");
    expect(screen.getByRole("img", { name: /post image preview 1/i })).toHaveAttribute("src", "blob:first.jpg");
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: postsKeys.infiniteFeedRoot,
      refetchType: "none",
    });
  });
});
