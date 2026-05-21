import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bffClient } from "#/lib/api/api-client/bff-client";
import { ApiRequestError } from "#/lib/api/utils/errors";
import { renderWithQueryClient } from "#/test/query-client";

import { PostsList } from "./posts-list";

vi.mock("#/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

describe("PostsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an empty feed", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce([]);

    renderWithQueryClient(<PostsList feedType="all" />);

    expect(await screen.findByRole("heading", { name: /no posts yet/i })).toBeInTheDocument();
    expect(bffClient).toHaveBeenCalledWith("/api/posts", "GET", {
      queryParams: {
        feed: "all",
      },
    });
  });

  it("renders posts returned by the API", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce([
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

    renderWithQueryClient(<PostsList feedType="all" />);

    expect(await screen.findByText(/maya johnson/i)).toBeInTheDocument();
    expect(screen.getByText(/planning a weekend photo walk/i)).toBeInTheDocument();
  });

  it("renders the API error message when the feed request fails", async () => {
    vi.mocked(bffClient).mockRejectedValueOnce(new ApiRequestError("Feed service is down", 503));

    renderWithQueryClient(<PostsList feedType="all" />);

    expect(await screen.findByRole("heading", { name: /feed is temporarily unavailable/i })).toBeInTheDocument();
    expect(screen.getByText(/feed service is down/i)).toBeInTheDocument();
  });
});
