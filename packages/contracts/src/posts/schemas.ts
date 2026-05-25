import { z } from "zod";

import { paginatedResponseSchema, paginationQueryShape, validatePaginationQuery } from "../pagination";

export const postVisibilitySchema = z.enum(["PUBLIC", "FRIENDS"]);

const postContentSchema = z
  .string()
  .trim()
  .min(1, {
    message: "Please provide a content",
  })
  .max(5000);
const postImageUrlSchema = z.string().url().nullable();

export const createPostSchema = z.object({
  content: postContentSchema,
  imageUrl: postImageUrlSchema.optional(),
  visibility: postVisibilitySchema.default("PUBLIC"),
});

export const updatePostSchema = z
  .object({
    content: postContentSchema.optional(),
    imageUrl: postImageUrlSchema.optional(),
    visibility: postVisibilitySchema.optional(),
  })
  .refine(
    (input) =>
      input.content !== undefined || input.visibility !== undefined || input.imageUrl !== undefined,
    {
      message: "At least one field must be provided",
    },
  );

export const postFeedSchema = z.enum(["all", "friends"]);

export const listPostsQuerySchema = z
  .object({
    authorId: z.string().uuid().optional(),
    feed: postFeedSchema.optional(),
    ...paginationQueryShape,
  })
  .superRefine((input, context) => {
    validatePaginationQuery(input, context);

    if (input.authorId && input.feed) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Use either authorId or feed, not both",
        path: ["feed"],
      });
    }
  });

export const PostAuthorSchema = z.object({
  avatarUrl: z.string().nullable(),
  displayName: z.string(),
  id: z.string(),
  username: z.string(),
});

export const PostSchema = z.object({
  author: PostAuthorSchema,
  content: z.string(),
  createdAt: z.string().datetime(),
  id: z.string(),
  imageUrl: z.string().nullable(),
  updatedAt: z.string().datetime(),
  visibility: postVisibilitySchema,
});

export const PostsSchema = z.array(PostSchema);

export const PaginatedPostsSchema = paginatedResponseSchema(PostSchema);
