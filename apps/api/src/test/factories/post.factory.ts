import type { PostAuthorDto, PostDto } from "@social/contracts";
import { PostVisibility } from "@social/database";

import { type PostWithAuthorRecord,serializePost } from "#modules/posts/posts.serializer";

export function buildPostAuthorDto(overrides: Partial<PostAuthorDto> = {}): PostAuthorDto {
  return {
    avatarUrl: null,
    displayName: "Ada Lovelace",
    id: "user-1",
    username: "ada",
    ...overrides,
  };
}

export function buildPersistedPost(
  overrides: Partial<PostWithAuthorRecord> = {},
): PostWithAuthorRecord {
  return {
    author: buildPostAuthorDto(),
    authorId: "user-1",
    content: "Hello world",
    createdAt: new Date("2026-05-05T10:00:00.000Z"),
    id: "post-1",
    imageUrl: null,
    updatedAt: new Date("2026-05-05T10:30:00.000Z"),
    visibility: PostVisibility.PUBLIC,
    ...overrides,
  };
}

export function buildPostDto(overrides: Partial<PostDto> = {}): PostDto {
  const post = serializePost(buildPersistedPost());

  return {
    ...post,
    ...overrides,
  };
}
