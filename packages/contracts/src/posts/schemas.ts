import { z } from "zod";

import { SchemaShape } from "../utils/schemaShape.type";
import type { CreatePostInput, ListPostsQueryInput, UpdatePostInput } from "./types";

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
} satisfies SchemaShape<CreatePostInput>);

export const updatePostSchema = z
  .object({
    content: postContentSchema.optional(),
    imageUrl: postImageUrlSchema.optional(),
    visibility: postVisibilitySchema.optional(),
  } satisfies SchemaShape<UpdatePostInput>)
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
  } satisfies SchemaShape<ListPostsQueryInput>)
  .refine((input) => !(input.authorId && input.feed), {
    message: "Use either authorId or feed, not both",
  });
