import { beforeEach, describe, expect, it, vi } from "vitest";
import { serverRequest } from "../requests/server-request";
import { postsApi } from "./actions";

vi.mock("../requests/server-request", () => ({
  serverRequest: vi.fn(),
}));

describe("postsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates posts through the backend posts endpoint", async () => {
    await postsApi.create({
      content: "Planning a weekend photo walk downtown.",
      imageUrl: null,
      visibility: "PUBLIC",
    });

    expect(serverRequest).toHaveBeenCalledWith("/posts", "POST", {
      body: {
        content: "Planning a weekend photo walk downtown.",
        imageUrl: null,
        visibility: "PUBLIC",
      },
    });
  });

  it("lists posts with normalized query params", async () => {
    await postsApi.list({
      feed: "friends",
    });

    expect(serverRequest).toHaveBeenCalledWith("/posts", "GET", {
      queryParams: {
        authorId: undefined,
        feed: "friends",
      },
    });
  });

  it("defaults list query params to an empty filter", async () => {
    await postsApi.list();

    expect(serverRequest).toHaveBeenCalledWith("/posts", "GET", {
      queryParams: {
        authorId: undefined,
        feed: undefined,
      },
    });
  });

  it("is re-exported from the posts API barrel", async () => {
    const { postsApi: reexportedPostsApi } = await import("./index");

    expect(reexportedPostsApi).toBe(postsApi);
  });
});
