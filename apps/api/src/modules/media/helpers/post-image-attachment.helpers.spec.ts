import { BadRequestException } from "@nestjs/common";
import { MediaAssetKind } from "@social/database";

import {
  assertMediaAssetsAttachableToPost,
  getRemovedPostImageAssets,
  isMediaAssetAttachableToPost,
  type SubmittedMediaAsset,
} from "./post-image-attachment.helpers";

const createSubmittedAsset = (
  overrides: Partial<SubmittedMediaAsset> = {},
): SubmittedMediaAsset =>
  ({
    createdAt: new Date("2026-05-27T12:00:00.000Z"),
    id: "asset-1",
    kind: MediaAssetKind.IMAGE,
    mimeType: "image/png",
    ownerId: "user-1",
    postImage: null,
    sizeBytes: 1234,
    storageKey: "storage-key",
    storageProvider: "cloudinary",
    updatedAt: new Date("2026-05-27T12:00:00.000Z"),
    url: "https://example.com/image.png",
    ...overrides,
  }) as SubmittedMediaAsset;

describe("post image attachment helpers", () => {
  it("returns assets that are no longer present in submitted image ids", () => {
    const keptAsset = createSubmittedAsset({ id: "kept-asset" });
    const removedAsset = createSubmittedAsset({ id: "removed-asset" });

    expect(
      getRemovedPostImageAssets(
        [
          {
            mediaAsset: keptAsset,
            mediaAssetId: "kept-asset",
          },
          {
            mediaAsset: removedAsset,
            mediaAssetId: "removed-asset",
          },
        ] as never,
        ["kept-asset"],
      ),
    ).toEqual([removedAsset]);
  });

  it("allows assets already attached to the same post", () => {
    expect(
      isMediaAssetAttachableToPost(
        createSubmittedAsset({
          postImage: {
            postId: "post-1",
          },
        }),
        "post-1",
      ),
    ).toBe(true);
  });

  it("rejects assets attached to a different post", () => {
    expect(
      isMediaAssetAttachableToPost(
        createSubmittedAsset({
          postImage: {
            postId: "other-post",
          },
        }),
        "post-1",
      ),
    ).toBe(false);
  });

  it("asserts all requested assets are attachable to the post", () => {
    expect(() =>
      assertMediaAssetsAttachableToPost(
        ["asset-1"],
        [
          createSubmittedAsset({
            postImage: {
              postId: "post-1",
            },
          }),
        ],
        "user-1",
        "post-1",
      ),
    ).not.toThrow();
  });

  it("rejects missing or non-owned assets", () => {
    expect(() =>
      assertMediaAssetsAttachableToPost(["asset-1"], [], "user-1", "post-1"),
    ).toThrow(BadRequestException);
    expect(() =>
      assertMediaAssetsAttachableToPost(
        ["asset-1"],
        [
          createSubmittedAsset({
            ownerId: "other-user",
          }),
        ],
        "user-1",
        "post-1",
      ),
    ).toThrow(BadRequestException);
  });
});
