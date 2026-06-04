import type { AuthUserDto, PaginatedPostsDto, PostDto } from "@social/contracts";
import { type InfiniteData, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authKeys } from "#/features/auth/api/routes";
import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { useToastStore } from "#/shared/ui/toast/store/toast";
import { createTestQueryClient } from "#/test/query-client";

import { postsKeys } from "../api/routes";
import { PostCard } from "./post-card";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

const post: PostDto = {
  author: {
    avatarUrl: null,
    displayName: "Maya Johnson",
    id: "author-1",
    username: "maya",
  },
  content: "Planning a weekend photo walk downtown.",
  createdAt: "2026-05-07T10:00:00.000Z",
  id: "post-1",
  images: [],
  updatedAt: "2026-05-07T10:00:00.000Z",
  visibility: "PUBLIC",
};

const postImage = (position: number) => ({
  id: `media-${position}`,
  imageId: `posts/post-1/image-${position}`,
  imageUrl: `https://res.cloudinary.com/demo/image/upload/post-${position}.jpg`,
  position,
});

const authorUser: AuthUserDto = {
  avatarUrl: null,
  bio: null,
  createdAt: "2026-05-07T10:00:00.000Z",
  displayName: "Maya Johnson",
  email: "maya@example.com",
  id: "author-1",
  username: "maya",
};

const otherUser: AuthUserDto = {
  avatarUrl: null,
  bio: null,
  createdAt: "2026-05-07T10:00:00.000Z",
  displayName: "Ada Lovelace",
  email: "ada@example.com",
  id: "author-2",
  username: "ada",
};

const postsPage = (items: PostDto[] = [post]): PaginatedPostsDto => ({
  items,
  pageInfo: {
    hasNextPage: false,
    limit: 20,
    mode: "cursor",
    nextCursor: null,
  },
});

const infinitePostsKey = postsKeys.infiniteFeed({
  feed: "all",
  mode: "cursor",
});

const infinitePostsData = (items: PostDto[] = [post]): InfiniteData<PaginatedPostsDto> => ({
  pageParams: [null],
  pages: [postsPage(items)],
});

const renderWithClient = (ui: ReactElement, activeUser: AuthUserDto | null = null) => {
  const queryClient = createTestQueryClient();

  if (activeUser !== undefined) {
    queryClient.setQueryData(authKeys.me(), activeUser);
  }

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
};

describe("PostCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useToastStore.getState().clearToasts();
    URL.createObjectURL = vi.fn((file: Blob) => `blob:${(file as File).name}`);
    URL.revokeObjectURL = vi.fn();
  });

  it("renders post author and content", () => {
    renderWithClient(<PostCard post={post} />);

    expect(screen.getByText(/maya johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/@maya/i)).toBeInTheDocument();
    expect(screen.getByText(/planning a weekend photo walk/i)).toBeInTheDocument();
  });

  it("renders social-style cropped post image previews and opens a full image viewer", async () => {
    renderWithClient(
      <PostCard
        post={{
          ...post,
          images: [postImage(0), postImage(1), postImage(2)],
        }}
      />,
    );

    const gallery = screen.getByRole("group", { name: /post images/i });
    const images = within(gallery).getAllByRole("img");
    const firstImage = images[0];

    expect(images.map((image) => image.getAttribute("alt"))).toEqual([
      "Post image 1",
      "Post image 2",
      "Post image 3",
    ]);
    if (!firstImage) {
      throw new Error("Expected at least one post image.");
    }

    expect(firstImage).toHaveClass("object-cover");
    expect(within(gallery).getByRole("status", { name: /loading post image 1/i })).toBeInTheDocument();

    fireEvent.load(firstImage);

    await waitFor(() =>
      expect(within(gallery).queryByRole("status", { name: /loading post image 1/i })).not.toBeInTheDocument(),
    );

    fireEvent.click(within(gallery).getByRole("button", { name: /open post image 1/i }));

    const dialog = screen.getByRole("dialog", { name: /post image 1/i });
    const fullImage = within(dialog).getByRole("img", { name: /post image 1 full view/i });

    expect(fullImage).toHaveClass("object-contain");
    expect(within(dialog).getByRole("status", { name: /loading post image 1 full view/i })).toBeInTheDocument();
  });

  it("shows post actions only for the author", () => {
    const { unmount } = renderWithClient(<PostCard post={post} />, authorUser);

    expect(screen.getByRole("button", { name: /open post actions/i })).toBeInTheDocument();
    unmount();

    renderWithClient(<PostCard post={post} />, otherUser);

    expect(screen.queryByRole("button", { name: /open post actions/i })).not.toBeInTheDocument();
  });

  it("opens the edit modal and updates an authored post", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({
      ...post,
      content: "Updated post content.",
    });

    renderWithClient(<PostCard post={post} />, authorUser);

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/post content/i), {
      target: {
        value: "Updated post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(bffClient).toHaveBeenCalled());

    const requestOptions = vi.mocked(bffClient).mock.calls[0]?.[2] as { body?: unknown } | undefined;
    const body = requestOptions?.body;

    expect(bffClient).toHaveBeenCalledWith("/api/posts/{id}", "PATCH", {
      body: expect.any(FormData),
      params: {
        id: "post-1",
      },
    });
    expect(body).toBeInstanceOf(FormData);
    expect(body instanceof FormData ? body.get("content") : undefined).toBe("Updated post content.");
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({
        description: "Post was successfully updated",
        type: "success",
      }),
    ]);
  });

  it("omits image order and files when editing without image changes", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({
      ...post,
      content: "Updated content.",
    });

    renderWithClient(<PostCard post={{ ...post, images: [postImage(0)] }} />, authorUser);

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/post content/i), {
      target: { value: "Updated content." },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(bffClient).toHaveBeenCalled());

    const body = (vi.mocked(bffClient).mock.calls[0]?.[2] as unknown as { body: FormData }).body;

    expect(body.get("content")).toBe("Updated content.");
    expect(body.get("imageOrder")).toBeNull();
    expect(body.getAll("images")).toEqual([]);
  });

  it("sends an image order without files when an existing image is removed", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ ...post, images: [postImage(0)] });

    renderWithClient(<PostCard post={{ ...post, images: [postImage(0), postImage(1)] }} />, authorUser);

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));

    const editDialog = screen.getByRole("dialog", { name: /edit post/i });

    fireEvent.click(within(editDialog).getByRole("button", { name: /remove post image 2/i }));
    fireEvent.click(within(editDialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(bffClient).toHaveBeenCalled());

    const body = (vi.mocked(bffClient).mock.calls[0]?.[2] as unknown as { body: FormData }).body;

    expect(JSON.parse(body.get("imageOrder") as string)).toEqual([{ id: "media-0", type: "existing" }]);
    expect(body.getAll("images")).toEqual([]);
  });

  it("sends an empty image order when all images are removed", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ ...post, images: [] });

    renderWithClient(<PostCard post={{ ...post, images: [postImage(0)] }} />, authorUser);

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));

    const editDialog = screen.getByRole("dialog", { name: /edit post/i });

    fireEvent.click(within(editDialog).getByRole("button", { name: /remove post image 1/i }));
    fireEvent.click(within(editDialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(bffClient).toHaveBeenCalled());

    const body = (vi.mocked(bffClient).mock.calls[0]?.[2] as unknown as { body: FormData }).body;

    expect(JSON.parse(body.get("imageOrder") as string)).toEqual([]);
  });

  it("uploads newly added images with an image order referencing the file index", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ ...post, images: [postImage(0)] });

    renderWithClient(<PostCard post={{ ...post, images: [] }} />, authorUser);

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));

    const editDialog = screen.getByRole("dialog", { name: /edit post/i });
    const newFile = new File(["image"], "added.png", { type: "image/png" });

    fireEvent.change(within(editDialog).getByLabelText(/choose post images/i), {
      target: { files: [newFile] },
    });
    fireEvent.click(within(editDialog).getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(bffClient).toHaveBeenCalled());

    const body = (vi.mocked(bffClient).mock.calls[0]?.[2] as unknown as { body: FormData }).body;

    expect(JSON.parse(body.get("imageOrder") as string)).toEqual([{ fileIndex: 0, type: "upload" }]);
    expect(body.getAll("images")).toEqual([newFile]);
  });

  it("keeps the edit modal open when update validation fails", async () => {
    vi.mocked(bffClient).mockRejectedValueOnce(
      new ApiRequestError("Could not update post", 422, {
        content: ["Post content is invalid"],
      }),
    );

    renderWithClient(<PostCard post={post} />, authorUser);

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/post content/i), {
      target: {
        value: "Rejected post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    expect(await screen.findByText("Post content is invalid")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: /edit post/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/post content/i)).toHaveValue("Rejected post content.");
  });

  it("writes the server response into cached infinite-feed posts after editing", async () => {
    const { queryClient } = renderWithClient(<PostCard post={post} />, authorUser);
    let resolveUpdate: (value: PostDto) => void = () => undefined;
    const invalidateQueries = vi.spyOn(queryClient, "invalidateQueries");

    queryClient.setQueryData(infinitePostsKey, infinitePostsData());
    vi.mocked(bffClient).mockReturnValueOnce(
      new Promise<PostDto>((resolve) => {
        resolveUpdate = resolve;
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/post content/i), {
      target: {
        value: "Edited post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    // The cache is not updated optimistically: it stays untouched until the request resolves.
    expect(queryClient.getQueryData<InfiniteData<PaginatedPostsDto>>(infinitePostsKey)?.pages[0]?.items[0]).toMatchObject(
      {
        content: "Planning a weekend photo walk downtown.",
      },
    );

    await act(async () => {
      resolveUpdate({
        ...post,
        content: "Server post content.",
      });
    });

    // After the request resolves, the cache reflects the server response.
    await waitFor(() =>
      expect(
        queryClient.getQueryData<InfiniteData<PaginatedPostsDto>>(infinitePostsKey)?.pages[0]?.items[0],
      ).toMatchObject({
        content: "Server post content.",
      }),
    );

    // No invalidation: the response already reconciles the cache.
    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("rolls back optimistic edit updates when the request fails", async () => {
    const { queryClient } = renderWithClient(<PostCard post={post} />, authorUser);

    queryClient.setQueryData(infinitePostsKey, infinitePostsData());
    vi.mocked(bffClient).mockRejectedValueOnce(new Error("Update failed"));

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/post content/i), {
      target: {
        value: "Optimistic post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(queryClient.getQueryData<InfiniteData<PaginatedPostsDto>>(infinitePostsKey)?.pages[0]?.items[0]).toMatchObject({
        content: "Planning a weekend photo walk downtown.",
      }),
    );
  });

  it("confirms before removing an authored post", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(null);

    renderWithClient(<PostCard post={post} />, authorUser);

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /remove/i }));

    expect(screen.getByRole("dialog", { name: /remove post/i })).toHaveTextContent(/cannot be undone/i);

    fireEvent.click(screen.getByRole("button", { name: /remove post/i }));

    await waitFor(() =>
      expect(bffClient).toHaveBeenCalledWith("/api/posts/{id}", "DELETE", {
        params: {
          id: "post-1",
        },
      }),
    );
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({
        description: "Post was successfully removed",
        type: "success",
      }),
    ]);
  });

  it("optimistically removes cached infinite-feed posts", async () => {
    const { queryClient } = renderWithClient(<PostCard post={post} />, authorUser);
    let resolveDelete: (value: null) => void = () => undefined;

    queryClient.setQueryData(infinitePostsKey, infinitePostsData());
    vi.mocked(bffClient).mockReturnValueOnce(
      new Promise<null>((resolve) => {
        resolveDelete = resolve;
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /remove/i }));
    fireEvent.click(screen.getByRole("button", { name: /remove post/i }));

    await waitFor(() =>
      expect(queryClient.getQueryData<InfiniteData<PaginatedPostsDto>>(infinitePostsKey)?.pages[0]?.items).toEqual([]),
    );

    await act(async () => {
      resolveDelete(null);
    });
  });
});
