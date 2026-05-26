import type { AuthUserDto, PaginatedPostsDto, PostDto } from "@social/contracts";
import { type InfiniteData, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAuthStore } from "#/features/auth/store/auth";
import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { useToastStore } from "#/shared/ui/toast/store/toast";
import { createTestQueryClient, renderWithQueryClient } from "#/test/query-client";

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
  imageUrl: null,
  updatedAt: "2026-05-07T10:00:00.000Z",
  visibility: "PUBLIC",
};

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

const renderWithClient = (ui: ReactElement) => {
  const queryClient = createTestQueryClient();

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
};

describe("PostCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
    });
    useToastStore.getState().clearToasts();
  });

  it("renders post author and content", () => {
    renderWithQueryClient(<PostCard post={post} />);

    expect(screen.getByText(/maya johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/@maya/i)).toBeInTheDocument();
    expect(screen.getByText(/planning a weekend photo walk/i)).toBeInTheDocument();
  });

  it("shows post actions only for the author", () => {
    useAuthStore.setState({
      user: authorUser,
    });

    const { unmount } = renderWithQueryClient(<PostCard post={post} />);

    expect(screen.getByRole("button", { name: /open post actions/i })).toBeInTheDocument();
    unmount();

    useAuthStore.setState({
      user: otherUser,
    });

    renderWithQueryClient(<PostCard post={post} />);

    expect(screen.queryByRole("button", { name: /open post actions/i })).not.toBeInTheDocument();
  });

  it("opens the edit modal and updates an authored post", async () => {
    useAuthStore.setState({
      user: authorUser,
    });
    vi.mocked(bffClient).mockResolvedValueOnce({
      ...post,
      content: "Updated post content.",
    });

    renderWithQueryClient(<PostCard post={post} />);

    fireEvent.click(screen.getByRole("button", { name: /open post actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText(/post content/i), {
      target: {
        value: "Updated post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(bffClient).toHaveBeenCalledWith("/api/posts/{id}", "PATCH", {
        body: {
          content: "Updated post content.",
        },
        params: {
          id: "post-1",
        },
      }),
    );
    expect(useToastStore.getState().toasts).toEqual([
      expect.objectContaining({
        description: "Post was successfully updated",
        type: "success",
      }),
    ]);
  });

  it("optimistically updates cached infinite-feed posts while editing", async () => {
    useAuthStore.setState({
      user: authorUser,
    });
    const { queryClient } = renderWithClient(<PostCard post={post} />);
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
        value: "Optimistic post content.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() =>
      expect(queryClient.getQueryData<InfiniteData<PaginatedPostsDto>>(infinitePostsKey)?.pages[0]?.items[0]).toMatchObject({
        content: "Optimistic post content.",
      }),
    );

    await act(async () => {
      resolveUpdate({
        ...post,
        content: "Server post content.",
      });
    });

    await waitFor(() =>
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: postsKeys.infiniteFeedRoot,
      }),
    );
  });

  it("rolls back optimistic edit updates when the request fails", async () => {
    useAuthStore.setState({
      user: authorUser,
    });
    const { queryClient } = renderWithClient(<PostCard post={post} />);

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
    useAuthStore.setState({
      user: authorUser,
    });
    vi.mocked(bffClient).mockResolvedValueOnce(null);

    renderWithQueryClient(<PostCard post={post} />);

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
    useAuthStore.setState({
      user: authorUser,
    });
    const { queryClient } = renderWithClient(<PostCard post={post} />);
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
