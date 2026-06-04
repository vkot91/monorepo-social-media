import { MediaAssetKind, PostVisibility } from "@social/database";

import { buildPersistedPost } from "#test/factories/post.factory";

import { type PostWithAuthorRecord, serializePost } from "./posts.serializer";

const buildImage = (overrides: Partial<PostWithAuthorRecord["images"][number]> = {}): PostWithAuthorRecord["images"][number] => ({
  createdAt: new Date("2026-05-05T10:00:00.000Z"),
  id: "post-image-1",
  mediaAsset: {
    createdAt: new Date("2026-05-05T10:00:00.000Z"),
    id: "media-asset-1",
    kind: MediaAssetKind.IMAGE,
    mimeType: "image/jpeg",
    ownerId: "user-1",
    sizeBytes: 1234,
    storageKey: "posts/media-asset-1",
    storageProvider: "cloudinary",
    updatedAt: new Date("2026-05-05T10:00:00.000Z"),
    url: "https://example.com/media-asset-1.jpg",
  },
  mediaAssetId: "media-asset-1",
  position: 0,
  postId: "post-1",
  ...overrides,
});

describe("serializePost", () => {
  it("exposes the media asset id as the image id so it can be reused in imageOrder", () => {
    const post = buildPersistedPost({
      images: [buildImage()],
      visibility: PostVisibility.PUBLIC,
    });

    const serialized = serializePost(post);

    expect(serialized.images).toEqual([
      {
        id: "media-asset-1",
        imageId: "posts/media-asset-1",
        imageUrl: "https://example.com/media-asset-1.jpg",
        position: 0,
      },
    ]);
  });
});
