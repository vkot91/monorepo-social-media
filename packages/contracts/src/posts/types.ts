import type { z } from "zod";

import type {
  createPostSchema,
  listPostsQuerySchema,
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

export type ListPostsQueryInput = z.input<typeof listPostsQuerySchema>;

export type PostAuthorDto = z.infer<typeof PostAuthorSchema>;

export type PostDto = z.infer<typeof PostSchema>;
