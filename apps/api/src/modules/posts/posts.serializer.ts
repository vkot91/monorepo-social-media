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
    images: {
      include: {
        mediaAsset: true,
      },
      orderBy: {
        position: "asc",
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
    images: post.images.map((image) => ({
      id: image.mediaAssetId,
      imageId: image.mediaAsset.storageKey,
      imageUrl: image.mediaAsset.url,
      position: image.position,
    })),
    updatedAt: post.updatedAt.toISOString(),
    visibility: post.visibility,
  };
}
