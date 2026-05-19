import { fireEvent, render, screen } from "@testing-library/react";
import { cookies } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PostsLoadingPlaceholder } from "#/features/posts/components";
import { serverRequest } from "#/lib/api/requests/server-request";
import { ApiRequestError, AuthRequiredError } from "#/lib/api/utils/errors";

import ProtectedLayout from "../layout";
import FeedPage, { FeedPosts } from "./page";

vi.mock("#/lib/api/requests/server-request", () => ({
  serverRequest: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  useRouter: () => ({
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => "/feed",
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

const cookieStore = {
  get: vi.fn(),
};

describe("FeedPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieStore.get.mockReset();
    vi.mocked(cookies).mockResolvedValue(
      cookieStore as unknown as Awaited<ReturnType<typeof cookies>>,
    );
  });

  it("defines the feed page shell", () => {
    expect(FeedPage()).toBeTruthy();
  });

  it("renders an empty protected feed", async () => {
    vi.mocked(serverRequest).mockResolvedValueOnce([]);

    render(await FeedPosts());

    expect(screen.getByRole("heading", { name: /no posts yet/i })).toBeInTheDocument();
    expect(serverRequest).toHaveBeenCalledWith("/posts", "GET", {
      queryParams: {
        feed: "friends",
      },
      retry: { attempts: 3 },
    });
  });

  it("renders the posts loading state", () => {
    render(<PostsLoadingPlaceholder />);

    expect(screen.getAllByLabelText(/posts loading/i)).toHaveLength(3);
  });

  it("renders protected navigation in the route layout", async () => {
    vi.mocked(serverRequest).mockResolvedValueOnce({
      avatarUrl: null,
      bio: null,
      createdAt: "2026-05-07T10:00:00.000Z",
      displayName: "Kostia",
      email: "kostia@example.com",
      id: "user-1",
      username: "kostia",
    });

    render(
      await ProtectedLayout({
        children: <div>Protected child</div>,
      }),
    );

    expect(screen.getAllByRole("link", { name: /home/i })[0]).toHaveAttribute("href", "/feed");
    expect(screen.getAllByRole("link", { name: /friends/i })[0]).toHaveAttribute(
      "href",
      "/friends",
    );
    expect(screen.getAllByRole("link", { name: /messages/i })[0]).toHaveAttribute(
      "href",
      "/messages",
    );
    expect(screen.getAllByRole("link", { name: /profile/i })[0]).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getAllByRole("link", { name: /settings/i })[0]).toHaveAttribute(
      "href",
      "/settings",
    );
    expect(screen.getByRole("searchbox", { name: /search/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sign out/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /theme preference: system/i })).toBeInTheDocument();
    expect(screen.getByText(/kostia/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open account menu/i }));

    expect(screen.getByRole("menuitem", { name: /profile/i })).toHaveAttribute(
      "href",
      "/profile",
    );
    expect(screen.getByRole("menuitem", { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByText(/protected child/i)).toBeInTheDocument();
  });

  it("renders posts returned by the API", async () => {
    vi.mocked(serverRequest).mockResolvedValueOnce([
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

  it("renders a fallback state when the API fails unexpectedly", async () => {
    vi.mocked(serverRequest).mockRejectedValueOnce(new Error("API unavailable"));

    render(await FeedPosts());

    expect(screen.getByRole("heading", { name: /feed is temporarily unavailable/i })).toBeInTheDocument();
    expect(screen.getByText("Feed is temporarily unavailable.")).toBeInTheDocument();
  });

  it("renders the API error message when the feed request fails", async () => {
    vi.mocked(serverRequest).mockRejectedValueOnce(new ApiRequestError("Feed service is down", 503));

    render(await FeedPosts());

    expect(screen.getByText(/feed service is down/i)).toBeInTheDocument();
  });

  it("redirects to login when auth is required", async () => {
    vi.mocked(serverRequest).mockRejectedValueOnce(new AuthRequiredError());

    await expect(FeedPosts()).rejects.toThrow("redirect:/login");
  });
});
