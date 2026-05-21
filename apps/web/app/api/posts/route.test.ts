import type { PostDto } from "@social/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendClient } from "#/lib/api/api-client/backend-client";

import { GET, POST } from "./route";

vi.mock("#/lib/api/api-client/backend-client", () => ({
  backendClient: vi.fn(),
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

const postRequest = (body: unknown) =>
  new Request("http://localhost/api/posts", {
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

describe("posts BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards typed feed queries to the backend", async () => {
    vi.mocked(backendClient).mockResolvedValueOnce([post]);

    const response = await GET(new Request("http://localhost/api/posts?feed=all"));

    await expect(response.json()).resolves.toEqual([post]);
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/posts", "GET", {
      queryParams: {
        authorId: undefined,
        feed: "all",
      },
    });
  });

  it("returns validation errors for invalid post queries", async () => {
    const response = await GET(new Request("http://localhost/api/posts?feed=mine"));

    await expect(response.json()).resolves.toMatchObject({
      message: "Please check the posts query and try again.",
    });
    expect(response.status).toBe(400);
    expect(backendClient).not.toHaveBeenCalled();
  });

  it("creates posts through the backend", async () => {
    vi.mocked(backendClient).mockResolvedValueOnce(post);

    const response = await POST(
      postRequest({
        content: " Planning a weekend photo walk downtown. ",
        imageUrl: null,
        visibility: "PUBLIC",
      }),
    );

    await expect(response.json()).resolves.toEqual(post);
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/posts", "POST", {
      body: {
        content: "Planning a weekend photo walk downtown.",
        imageUrl: null,
        visibility: "PUBLIC",
      },
    });
  });

  it("returns validation errors for invalid create requests", async () => {
    const response = await POST(
      postRequest({
        content: "",
        imageUrl: null,
        visibility: "PUBLIC",
      }),
    );

    await expect(response.json()).resolves.toMatchObject({
      errors: {
        content: expect.any(Array),
      },
      message: "Please check your post and try again.",
    });
    expect(response.status).toBe(400);
    expect(backendClient).not.toHaveBeenCalled();
  });
});
