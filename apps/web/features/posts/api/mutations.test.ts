import { describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

import {
  createPost,
  createPostFormData,
  updatePost,
  updatePostFormData,
} from "./mutations";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

const createImageFile = (name: string, type = "image/jpeg") => new File(["image-content"], name, { type });

describe("post mutations", () => {
  it("builds create post FormData with text fields and ordered images", () => {
    const firstImage = createImageFile("first.jpg");
    const secondImage = createImageFile("second.webp", "image/webp");
    const formData = createPostFormData({
      content: "Created post content.",
      images: [firstImage, secondImage],
      visibility: "PUBLIC",
    });

    const images = formData.getAll("images");

    expect(formData.get("content")).toBe("Created post content.");
    expect(formData.get("visibility")).toBe("PUBLIC");
    expect(images).toEqual([firstImage, secondImage]);
  });

  it("omits optional create fields when absent", () => {
    const formData = createPostFormData({
      content: "Created post content.",
    });

    expect(formData.get("content")).toBe("Created post content.");
    expect(formData.has("visibility")).toBe(false);
    expect(formData.getAll("images")).toEqual([]);
  });

  it("submits create posts as multipart BFF requests", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({
      id: "post-1",
    });

    await createPost({
      content: "Created post content.",
      images: [createImageFile("first.jpg")],
      visibility: "FRIENDS",
    });

    expect(bffClient).toHaveBeenCalledWith("/api/posts", "POST", {
      body: expect.any(FormData),
    });
  });

  it("builds update post FormData with changed fields, image order, and ordered new images", () => {
    const newImage = createImageFile("new-image.png", "image/png");
    const imageOrder = [
      {
        id: "00000000-0000-4000-8000-000000000001",
        type: "existing" as const,
      },
      {
        fileIndex: 0,
        type: "upload" as const,
      },
    ];
    const formData = updatePostFormData({
      content: "Updated post content.",
      imageOrder,
      images: [newImage],
      visibility: "FRIENDS",
    });

    expect(formData.get("content")).toBe("Updated post content.");
    expect(formData.get("visibility")).toBe("FRIENDS");
    expect(formData.get("imageOrder")).toBe(JSON.stringify(imageOrder));
    expect(formData.getAll("images")).toEqual([newImage]);
  });

  it("preserves an empty update image order", () => {
    const formData = updatePostFormData({
      imageOrder: [],
    });

    expect(formData.get("imageOrder")).toBe("[]");
  });

  it("submits update posts as multipart BFF requests", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({
      id: "post-1",
    });

    await updatePost({
      input: {
        content: "Updated post content.",
        images: [createImageFile("new-image.png", "image/png")],
      },
      postId: "post-1",
    });

    expect(bffClient).toHaveBeenCalledWith("/api/posts/{id}", "PATCH", {
      body: expect.any(FormData),
      params: {
        id: "post-1",
      },
    });
  });
});
