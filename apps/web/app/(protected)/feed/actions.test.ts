import { beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { ApiRequestError, AuthRequiredError } from "#/lib/api/errors";
import { postsApi } from "#/lib/api/posts/actions";
import { createPost, createPostInitialState } from "./actions";

vi.mock("#/lib/api/posts/actions", () => ({
  postsApi: {
    create: vi.fn(),
  },
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

describe("createPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns validation errors for invalid form data", async () => {
    const result = await createPost(createPostInitialState, createFormData({ content: "" }));

    expect(result.status).toBe("error");
    expect(result.message).toBe("Please check your post and try again.");
    expect(result.errors.content).toBeDefined();
    expect(postsApi.create).not.toHaveBeenCalled();
  });

  it("creates a post and revalidates the feed", async () => {
    vi.mocked(postsApi.create).mockResolvedValueOnce({
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
    });

    const result = await createPost(
      createPostInitialState,
      createFormData({
        content: " Planning a weekend photo walk downtown. ",
        imageUrl: "",
        visibility: "PUBLIC",
      }),
    );

    expect(postsApi.create).toHaveBeenCalledWith({
      content: "Planning a weekend photo walk downtown.",
      imageUrl: null,
      visibility: "PUBLIC",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/feed");
    expect(result).toEqual({
      errors: {},
      message: "Post created.",
      status: "success",
    });
  });

  it("redirects to login when auth is required", async () => {
    vi.mocked(postsApi.create).mockRejectedValueOnce(new AuthRequiredError());

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
    vi.mocked(postsApi.create).mockRejectedValueOnce(new ApiRequestError("Post was rejected", 400));

    const result = await createPost(
      createPostInitialState,
      createFormData({
        content: "Hello world",
      }),
    );

    expect(result).toEqual({
      errors: {},
      message: "Post was rejected",
      status: "error",
    });
  });

  it("returns an unavailable state for unexpected create errors", async () => {
    vi.mocked(postsApi.create).mockRejectedValueOnce(new Error("network unavailable"));

    const result = await createPost(
      createPostInitialState,
      createFormData({
        content: "Hello world",
      }),
    );

    expect(result).toEqual({
      errors: {},
      message: "Post creation is unavailable right now.",
      status: "error",
    });
  });
});
