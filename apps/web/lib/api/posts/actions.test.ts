import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiRequestError, AuthRequiredError } from "#/lib/api/utils/errors";

import { createIdleResponse } from "../requests/responses";
import { serverRequest } from "../requests/server-request";
import { createPost, type CreatePostState } from "./actions";

vi.mock("../requests/server-request", () => ({
  serverRequest: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));

const createFormData = (values: Record<string, string>) => {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
};

const createPostInitialState = createIdleResponse() satisfies CreatePostState;

describe("createPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation errors for invalid form data", async () => {
    const result = await createPost(createPostInitialState, createFormData({ content: "" }));

    expect(result.status).toBe("error");
    expect(result.message).toBe("Please check your post and try again.");
    expect(result.errors.content).toBeDefined();
    expect(serverRequest).not.toHaveBeenCalled();
  });

  it("creates a post and revalidates the feed", async () => {
    const post = {
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
    } as const;

    vi.mocked(serverRequest).mockResolvedValueOnce(post);

    const result = await createPost(
      createPostInitialState,
      createFormData({
        content: " Planning a weekend photo walk downtown. ",
        imageUrl: "",
        visibility: "PUBLIC",
      }),
    );

    expect(serverRequest).toHaveBeenCalledWith("/posts", "POST", {
      body: {
        content: "Planning a weekend photo walk downtown.",
        imageUrl: null,
        visibility: "PUBLIC",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/feed");
    expect(result).toEqual({
      data: post,
      errors: {},
      message: "Post created.",
      status: "success",
    });
  });

  it("redirects to login when auth is required", async () => {
    vi.mocked(serverRequest).mockRejectedValueOnce(new AuthRequiredError());

    await expect(
      createPost(
        createPostInitialState,
        createFormData({
          content: "Hello world",
        }),
      ),
    ).rejects.toThrow("redirect:/login");
  });

  it("returns API errors as form state", async () => {
    vi.mocked(serverRequest).mockRejectedValueOnce(new ApiRequestError("Post was rejected", 400));

    const result = await createPost(
      createPostInitialState,
      createFormData({
        content: "Hello world",
      }),
    );

    expect(result).toEqual({
      data: null,
      errors: {},
      message: "Post was rejected",
      status: "error",
    });
  });

  it("returns an unavailable state for unexpected create errors", async () => {
    vi.mocked(serverRequest).mockRejectedValueOnce(new Error("network unavailable"));

    const result = await createPost(
      createPostInitialState,
      createFormData({
        content: "Hello world",
      }),
    );

    expect(result).toEqual({
      data: null,
      errors: {},
      message: "Post creation is unavailable right now.",
      status: "error",
    });
  });
});
