import type { PostDto } from "@social/contracts";
import type { Prisma } from "@social/database";

export const postWithAuthor = {
  include: {
    author: {
      select: {
        avatarUrl: true,
        displayName: true,
        id: true,
        username: true,
      },
    },
  },
} satisfies Prisma.PostDefaultArgs;

export type PostWithAuthorRecord = Prisma.PostGetPayload<typeof postWithAuthor>;

export function serializePost(post: PostWithAuthorRecord): PostDto {
  return {
    author: post.author,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    id: post.id,
    imageUrl: post.imageUrl,
    updatedAt: post.updatedAt.toISOString(),
    visibility: post.visibility,
  };
}
