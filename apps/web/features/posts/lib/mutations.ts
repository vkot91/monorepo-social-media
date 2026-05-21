"use client";

import type { CreatePostInput } from "@social/contracts";

import { bffClient } from "#/lib/api/api-client/bff-client";

export const createPost = (input: CreatePostInput) =>
  bffClient("/api/posts", "POST", {
    body: input,
  });
