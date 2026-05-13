import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PostsLoadingPlaceholder } from "#/components/posts/loading-placeholder";
import { AuthRequiredError } from "#/lib/api/errors";
import { postsApi } from "#/lib/api/posts/actions";
import FeedPage, { FeedPosts } from "./page";
import ProtectedLayout from "../layout";

vi.mock("#/lib/api/posts/actions", () => ({
  postsApi: {
    list: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe("FeedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defines the feed page shell", () => {
    expect(FeedPage()).toBeTruthy();
  });

  it("renders an empty protected feed", async () => {
    vi.mocked(postsApi.list).mockResolvedValueOnce([]);

    render(await FeedPosts());

    expect(screen.getByRole("heading", { name: /no posts yet/i })).toBeInTheDocument();
    expect(postsApi.list).toHaveBeenCalledWith({ feed: "friends" });
  });

  it("renders the posts loading state", () => {
    render(<PostsLoadingPlaceholder />);

    expect(screen.getAllByLabelText(/posts loading/i)).toHaveLength(3);
  });

  it("renders protected navigation in the route layout", () => {
    render(
      <ProtectedLayout>
        <div>Protected child</div>
      </ProtectedLayout>,
    );

    expect(screen.getByRole("link", { name: /feed/i })).toHaveAttribute("href", "/feed");
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
    expect(screen.getByText(/protected child/i)).toBeInTheDocument();
  });

  it("renders posts returned by the API", async () => {
    vi.mocked(postsApi.list).mockResolvedValueOnce([
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
    ]);

    render(await FeedPosts());

    expect(screen.getByText(/maya johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/planning a weekend photo walk/i)).toBeInTheDocument();
  });

  it("renders a temporary unavailable state when the API fails", async () => {
    vi.mocked(postsApi.list).mockRejectedValueOnce(new Error("API unavailable"));

    render(await FeedPosts());

    expect(screen.getByRole("heading", { name: /feed is temporarily unavailable/i })).toBeInTheDocument();
  });

  it("redirects to login when auth is required", async () => {
    vi.mocked(postsApi.list).mockRejectedValueOnce(new AuthRequiredError());

    await expect(FeedPosts()).rejects.toThrow("redirect:/login");
  });
});
