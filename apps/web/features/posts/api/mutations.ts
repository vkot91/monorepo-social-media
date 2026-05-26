"use client";

import type { CreatePostInput, UpdatePostInput } from "@social/contracts";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

export const createPost = (input: CreatePostInput) =>
  bffClient("/api/posts", "POST", {
    body: input,
  });

export const updatePost = ({ input, postId }: { input: UpdatePostInput; postId: string }) =>
  bffClient("/api/posts/{id}", "PATCH", {
    body: input,
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
