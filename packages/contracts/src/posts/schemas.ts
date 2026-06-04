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

export const postImageInputSchema = z.object({
  id: z.string().uuid(),
});

const jsonField = (value: unknown) => {
  if (value === undefined || typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};

export const postImageOrderItemSchema = z.discriminatedUnion("type", [
  z.object({
    id: z.string().uuid(),
    type: z.literal("existing"),
  }),
  z.object({
    fileIndex: z.number().int().nonnegative(),
    type: z.literal("upload"),
  }),
]);

export const postImageSchema = z.object({
  id: z.string(),
  imageId: z.string(),
  imageUrl: z.string().url(),
  position: z.number().int().nonnegative(),
});

export const createPostSchema = z.object({
  content: postContentSchema,
  visibility: postVisibilitySchema.default("PUBLIC"),
});

export const updatePostSchema = z
  .object({
    content: postContentSchema.optional(),
    imageOrder: z.preprocess(jsonField, z.array(postImageOrderItemSchema).max(4).optional()),
    visibility: postVisibilitySchema.optional(),
  })
  .refine(
    (input) =>
      input.content !== undefined ||
      input.visibility !== undefined ||
      input.imageOrder !== undefined,
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
  images: z.array(postImageSchema),
  updatedAt: z.string().datetime(),
  visibility: postVisibilitySchema,
});

export const PostsSchema = z.array(PostSchema);

export const PaginatedPostsSchema = paginatedResponseSchema(PostSchema);
