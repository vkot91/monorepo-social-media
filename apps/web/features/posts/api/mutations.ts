"use client";

import type { CreatePostInput, UpdatePostInput } from "@social/contracts";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

export type CreatePostMutationInput = CreatePostInput & {
  images?: File[];
};

export type UpdatePostMutationInput = UpdatePostInput & {
  images?: File[];
};

const appendFiles = (formData: FormData, files?: File[]) => {
  files?.forEach((file) => {
    formData.append("images", file);
  });
};

export const createPostFormData = ({ content, images, visibility }: CreatePostMutationInput) => {
  const formData = new FormData();

  formData.append("content", content);

  if (visibility !== undefined) {
    formData.append("visibility", visibility);
  }

  appendFiles(formData, images);

  return formData;
};

export const updatePostFormData = ({ content, imageOrder, images, visibility }: UpdatePostMutationInput) => {
  const formData = new FormData();

  if (content !== undefined) {
    formData.append("content", content);
  }

  if (visibility !== undefined) {
    formData.append("visibility", visibility);
  }

  if (imageOrder !== undefined) {
    formData.append("imageOrder", JSON.stringify(imageOrder));
  }

  appendFiles(formData, images);

  return formData;
};

export const createPost = (input: CreatePostMutationInput) =>
  bffClient("/api/posts", "POST", {
    body: createPostFormData(input),
  });

export const updatePost = ({ input, postId }: { input: UpdatePostMutationInput; postId: string }) =>
  bffClient("/api/posts/{id}", "PATCH", {
    body: updatePostFormData(input),
    params: {
      id: postId,
    },
  });

export const deletePost = (postId: string) =>
  bffClient("/api/posts/{id}", "DELETE", {
    params: {
      id: postId,
    },
  });
