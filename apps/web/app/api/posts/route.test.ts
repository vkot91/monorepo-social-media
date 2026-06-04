import type { PaginatedPostsDto, PostDto } from "@social/contracts";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { ApiRequestError, AuthRequiredError } from "#/shared/lib/api/utils/errors";

import { DELETE, PATCH } from "./[postId]/route";
import { GET, POST } from "./route";

vi.mock("#/shared/lib/api/api-client/backend-client", () => ({
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
  images: [],
  updatedAt: "2026-05-07T10:00:00.000Z",
  visibility: "PUBLIC",
};

const paginatedPosts: PaginatedPostsDto = {
  items: [post],
  pageInfo: {
    hasNextPage: false,
    limit: 20,
    mode: "cursor",
    nextCursor: null,
  },
};

const multipartPostRequest = (body: FormData) =>
  ({
    formData: vi.fn().mockResolvedValue(body),
  }) as unknown as Request;

const multipartPatchRequest = (body: FormData) =>
  ({
    formData: vi.fn().mockResolvedValue(body),
  }) as unknown as Request;

const postRouteContext = {
  params: Promise.resolve({
    postId: "post-1",
  }),
};

const createImageBlob = (type = "image/jpeg") => new Blob(["image-content"], { type });

describe("posts BFF routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("forwards typed feed queries to the backend", async () => {
    vi.mocked(backendClient).mockResolvedValueOnce(paginatedPosts);

    const response = await GET(new Request("http://localhost/api/posts?feed=all&limit=20&mode=cursor"));

    await expect(response.json()).resolves.toEqual(paginatedPosts);
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/posts", "GET", {
      queryParams: {
        authorId: undefined,
        cursor: undefined,
        feed: "all",
        limit: 20,
        mode: "cursor",
        page: undefined,
      },
    });
  });

  it("forwards offset pagination queries to the backend", async () => {
    vi.mocked(backendClient).mockResolvedValueOnce({
      items: [post],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: true,
        limit: 10,
        mode: "offset",
        page: 2,
        totalItems: 11,
        totalPages: 2,
      },
    });

    const response = await GET(new Request("http://localhost/api/posts?feed=all&limit=10&mode=offset&page=2"));

    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/posts", "GET", {
      queryParams: {
        authorId: undefined,
        cursor: undefined,
        feed: "all",
        limit: 10,
        mode: "offset",
        page: 2,
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

  it("maps feed backend failures to the feed fallback", async () => {
    vi.mocked(backendClient).mockRejectedValueOnce(new Error("backend unavailable"));

    const response = await GET(new Request("http://localhost/api/posts?feed=all&limit=20&mode=cursor"));

    await expect(response.json()).resolves.toEqual({
      errors: {},
      message: "Feed is temporarily unavailable.",
    });
    expect(response.status).toBe(500);
  });

  it("forwards multipart post creation requests to the backend", async () => {
    const formData = new FormData();

    formData.append("content", " Planning a weekend photo walk downtown. ");
    formData.append("visibility", "PUBLIC");
    formData.append("images", createImageBlob(), "first.jpg");
    formData.append("images", createImageBlob("image/webp"), "second.webp");
    vi.mocked(backendClient).mockResolvedValueOnce(post);

    const response = await POST(multipartPostRequest(formData));

    await expect(response.json()).resolves.toEqual(post);
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/posts", "POST", {
      body: expect.any(FormData),
    });

    const backendCall = vi.mocked(backendClient).mock.calls[0] as unknown as
      | [string, string, { body: FormData }]
      | undefined;

    if (!backendCall) {
      throw new Error("Expected backendClient to receive request options.");
    }

    const [, , requestOptions] = backendCall;
    const forwardedFormData = requestOptions.body as FormData;
    const forwardedImages = forwardedFormData.getAll("images");

    expect(forwardedFormData.get("content")).toBe(" Planning a weekend photo walk downtown. ");
    expect(forwardedFormData.get("visibility")).toBe("PUBLIC");
    expect(forwardedImages).toHaveLength(2);
    expect((forwardedImages[0] as File).name).toBe("first.jpg");
    expect((forwardedImages[1] as File).name).toBe("second.webp");
  });

  it("maps create backend failures to the post creation fallback", async () => {
    const formData = new FormData();

    formData.append("content", "Planning a weekend photo walk downtown.");
    vi.mocked(backendClient).mockRejectedValueOnce(new Error("backend unavailable"));

    const response = await POST(multipartPostRequest(formData));

    await expect(response.json()).resolves.toEqual({
      errors: {},
      message: "Post creation is unavailable right now.",
    });
    expect(response.status).toBe(500);
  });

  it("maps create API errors through the BFF response helpers", async () => {
    const formData = new FormData();

    formData.append("content", "");
    vi.mocked(backendClient).mockRejectedValueOnce(
      new ApiRequestError("Please check your post and try again.", 400, {
        content: ["Post content is required."],
      }),
    );

    const response = await POST(multipartPostRequest(formData));

    await expect(response.json()).resolves.toEqual({
      errors: {
        content: ["Post content is required."],
      },
      message: "Please check your post and try again.",
    });
    expect(response.status).toBe(400);
  });

  it("maps missing create auth to 401", async () => {
    const formData = new FormData();

    formData.append("content", "Planning a weekend photo walk downtown.");
    vi.mocked(backendClient).mockRejectedValueOnce(new AuthRequiredError());

    const response = await POST(multipartPostRequest(formData));

    await expect(response.json()).resolves.toEqual({
      errors: {},
      message: "Authentication is required",
    });
    expect(response.status).toBe(401);
  });

  it("forwards multipart post update requests to the backend", async () => {
    const updatedPost = {
      ...post,
      content: "Updated post content.",
    };
    const formData = new FormData();
    const imageOrder = JSON.stringify([
      {
        id: "asset-1",
        type: "existing",
      },
      {
        fileIndex: 0,
        type: "upload",
      },
    ]);

    formData.append("content", " Updated post content. ");
    formData.append("visibility", "FRIENDS");
    formData.append("imageOrder", imageOrder);
    formData.append("images", createImageBlob("image/png"), "new-image.png");
    vi.mocked(backendClient).mockResolvedValueOnce(updatedPost);

    const response = await PATCH(multipartPatchRequest(formData), postRouteContext);

    await expect(response.json()).resolves.toEqual(updatedPost);
    expect(response.status).toBe(200);
    expect(backendClient).toHaveBeenCalledWith("/posts/{id}", "PATCH", {
      body: expect.any(FormData),
      params: {
        id: "post-1",
      },
    });

    const backendCall = vi.mocked(backendClient).mock.calls[0] as unknown as
      | [string, string, { body: FormData }]
      | undefined;

    if (!backendCall) {
      throw new Error("Expected backendClient to receive request options.");
    }

    const [, , requestOptions] = backendCall;
    const forwardedFormData = requestOptions.body as FormData;
    const forwardedImages = forwardedFormData.getAll("images");

    expect(forwardedFormData.get("content")).toBe(" Updated post content. ");
    expect(forwardedFormData.get("visibility")).toBe("FRIENDS");
    expect(forwardedFormData.get("imageOrder")).toBe(imageOrder);
    expect(forwardedImages).toHaveLength(1);
    expect((forwardedImages[0] as File).name).toBe("new-image.png");
  });

  it("maps update backend failures to the post update fallback", async () => {
    const formData = new FormData();

    formData.append("content", "Updated post content.");
    vi.mocked(backendClient).mockRejectedValueOnce(new Error("backend unavailable"));

    const response = await PATCH(multipartPatchRequest(formData), postRouteContext);

    await expect(response.json()).resolves.toEqual({
      errors: {},
      message: "Post update is unavailable right now.",
    });
    expect(response.status).toBe(500);
  });

  it("maps update API errors through the BFF response helpers", async () => {
    const formData = new FormData();

    formData.append("content", "");
    vi.mocked(backendClient).mockRejectedValueOnce(
      new ApiRequestError("Please check your post and try again.", 400, {
        content: ["Post content is required."],
      }),
    );

    const response = await PATCH(multipartPatchRequest(formData), postRouteContext);

    await expect(response.json()).resolves.toEqual({
      errors: {
        content: ["Post content is required."],
      },
      message: "Please check your post and try again.",
    });
    expect(response.status).toBe(400);
  });

  it("deletes posts through the backend", async () => {
    vi.mocked(backendClient).mockResolvedValueOnce(null);

    const response = await DELETE(new Request("http://localhost/api/posts/post-1"), postRouteContext);

    expect(response.status).toBe(204);
    expect(backendClient).toHaveBeenCalledWith("/posts/{id}", "DELETE", {
      params: {
        id: "post-1",
      },
    });
  });

  it("maps delete backend failures to the post removal fallback", async () => {
    vi.mocked(backendClient).mockRejectedValueOnce(new Error("backend unavailable"));

    const response = await DELETE(new Request("http://localhost/api/posts/post-1"), postRouteContext);

    await expect(response.json()).resolves.toEqual({
      errors: {},
      message: "Post removal is unavailable right now.",
    });
    expect(response.status).toBe(500);
  });
});
