import type { z } from "zod";

import type { PaginatedResponse, PaginationQueryInput } from "../pagination";
import type {
  createPostSchema,
  PostAuthorSchema,
  postFeedSchema,
  PostSchema,
  postVisibilitySchema,
  updatePostSchema,
} from "./schemas";

export type PostVisibility = z.infer<typeof postVisibilitySchema>;

export type CreatePostInput = z.input<typeof createPostSchema>;

export type UpdatePostInput = z.input<typeof updatePostSchema>;

export type PostFeed = z.infer<typeof postFeedSchema>;

export type ListPostsQueryInput = {
  authorId?: string;
  feed?: PostFeed;
} & PaginationQueryInput;

export type PostAuthorDto = z.infer<typeof PostAuthorSchema>;

export type PostDto = z.infer<typeof PostSchema>;

export type PaginatedPostsDto = PaginatedResponse<PostDto>;
