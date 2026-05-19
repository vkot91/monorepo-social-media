import { beforeEach, describe, expect, it, vi } from "vitest";

import { serverRequest } from "../requests/server-request";
import { ApiRequestError, AuthRequiredError } from "../utils/errors";
import { getPosts } from "./queries";

vi.mock("../requests/server-request", () => ({
  serverRequest: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

describe("posts queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPosts", () => {
    it("returns posts for the selected feed", async () => {
      const posts = [
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
      ] as const;

      vi.mocked(serverRequest).mockResolvedValueOnce(posts);

      await expect(getPosts("all")).resolves.toEqual({
        posts,
        status: "success",
      });
      expect(serverRequest).toHaveBeenCalledWith("/posts", "GET", {
        queryParams: {
          feed: "all",
        },
        retry: {
          attempts: 3,
        },
      });
    });

    it("returns a fallback state when the API fails unexpectedly", async () => {
      vi.mocked(serverRequest).mockRejectedValueOnce(new Error("API unavailable"));

      await expect(getPosts("all")).resolves.toEqual({
        message: "Feed is temporarily unavailable.",
        status: "error",
      });
    });

    it("returns API error messages when the feed request fails", async () => {
      vi.mocked(serverRequest).mockRejectedValueOnce(new ApiRequestError("Feed service is down", 503));

      await expect(getPosts("all")).resolves.toEqual({
        message: "Feed service is down",
        status: "error",
      });
    });

    it("redirects to login when auth is required", async () => {
      vi.mocked(serverRequest).mockRejectedValueOnce(new AuthRequiredError());

      await expect(getPosts("all")).rejects.toThrow("redirect:/login");
    });
  });
});
