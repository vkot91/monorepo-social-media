import type { PostDto } from "@social/contracts";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { ApiRequestError } from "#/shared/lib/api/utils/errors";
import { createTestQueryClient, renderWithQueryClient } from "#/test/query-client";

import { CreatePostForm } from "./create-post-form";
import { PostsList } from "./posts-list";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

const intersectionObserverCallbacks: IntersectionObserverCallback[] = [];

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [];

  disconnect = vi.fn();
  observe = vi.fn();
  takeRecords = vi.fn(() => []);
  unobserve = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    intersectionObserverCallbacks.push(callback);
  }
}

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

const postsPage = (items: PostDto[] = [post]) => ({
  items,
  pageInfo: {
    hasNextPage: false,
    limit: 20,
    mode: "cursor" as const,
    nextCursor: null,
  },
});

const renderWithClient = (ui: ReactElement) => {
  const queryClient = createTestQueryClient();

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
};

describe("PostsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    intersectionObserverCallbacks.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  it("renders an empty feed", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({
      items: [],
      pageInfo: {
        hasNextPage: false,
        limit: 20,
        mode: "cursor",
        nextCursor: null,
      },
    });

    renderWithQueryClient(<PostsList feedType="all" />);

    expect(await screen.findByRole("heading", { name: /no posts yet/i })).toBeInTheDocument();
    expect(bffClient).toHaveBeenCalledWith("/api/posts", "GET", {
      queryParams: {
        feed: "all",
        mode: "cursor",
      },
    });
  });

  it("renders posts returned by the API", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(postsPage());

    renderWithQueryClient(<PostsList feedType="all" />);

    expect(await screen.findByText(/maya johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/planning a weekend photo walk/i)).toBeInTheDocument();
  });

  it("loads the next cursor page when the bottom of the feed is reached", async () => {
    vi.mocked(bffClient)
      .mockResolvedValueOnce({
        items: [
          {
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
          },
        ],
        pageInfo: {
          hasNextPage: true,
          limit: 20,
          mode: "cursor",
          nextCursor: "cursor-1",
        },
      })
      .mockResolvedValueOnce({
        items: [
          {
            author: {
              avatarUrl: null,
              displayName: "Ada Lovelace",
              id: "author-2",
              username: "ada",
            },
            content: "Second page post.",
            createdAt: "2026-05-06T10:00:00.000Z",
            id: "post-2",
            imageUrl: null,
            updatedAt: "2026-05-06T10:00:00.000Z",
            visibility: "PUBLIC",
          },
        ],
        pageInfo: {
          hasNextPage: false,
          limit: 20,
          mode: "cursor",
          nextCursor: null,
        },
      });

    renderWithQueryClient(<PostsList feedType="all" />);

    const sentinel = await screen.findByTestId("posts-load-more-sentinel");

    await waitFor(() => expect(intersectionObserverCallbacks).toHaveLength(1));

    const onIntersect = intersectionObserverCallbacks[0];

    expect(onIntersect).toBeDefined();

    if (!onIntersect) {
      throw new Error("Expected PostsList to register an intersection observer.");
    }

    act(() => {
      onIntersect(
        [
          {
            isIntersecting: true,
            target: sentinel,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(await screen.findByText(/second page post/i)).toBeInTheDocument();
    expect(bffClient).toHaveBeenLastCalledWith("/api/posts", "GET", {
      queryParams: {
        cursor: "cursor-1",
        feed: "all",
        mode: "cursor",
      },
    });
  });

  it("renders the API error message when the feed request fails", async () => {
    vi.mocked(bffClient).mockRejectedValueOnce(new ApiRequestError("Feed service is down", 503));

    renderWithQueryClient(<PostsList feedType="all" />);

    expect(await screen.findByRole("heading", { name: /feed is temporarily unavailable/i })).toBeInTheDocument();
    expect(screen.getByText(/feed service is down/i)).toBeInTheDocument();
  });

  it("keeps a masked pending post while the created post is refreshing into the feed", async () => {
    let resolveCreate: (value: PostDto) => void = () => undefined;

    vi.mocked(bffClient).mockResolvedValueOnce(postsPage()).mockReturnValueOnce(
      new Promise<PostDto>((resolve) => {
        resolveCreate = resolve;
      }),
    );

    const { queryClient } = renderWithClient(
      <>
        <CreatePostForm />
        <PostsList feedType="all" />
      </>,
    );
    vi.spyOn(queryClient, "invalidateQueries").mockReturnValue(new Promise(() => undefined));

    expect(await screen.findByText(/planning a weekend photo walk/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/create post/i), {
      target: {
        value: "Post that is still being created.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^post$/i }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Posting post..."));

    await act(async () => {
      resolveCreate(post);
    });

    await waitFor(() => expect(screen.getByRole("button", { name: /^post$/i })).not.toHaveAttribute("aria-busy"));
    expect(screen.getByRole("status")).toHaveTextContent("Posting post...");
  });
});
