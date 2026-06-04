import type { PostImageDto } from "@social/contracts";
import { describe, expect, it } from "vitest";

import { buildUpdateImagePayload, haveManagedImagesChanged, mapPostImagesToManaged } from "./image-order";
import type { ManagedPostImage } from "./types";

const postImage = (position: number): PostImageDto => ({
  id: `media-${position}`,
  imageId: `storage-${position}`,
  imageUrl: `https://example.com/${position}.jpg`,
  position,
});

const existing = (id: string): ManagedPostImage => ({
  id,
  imageId: `storage-${id}`,
  imageUrl: `https://example.com/${id}.jpg`,
  kind: "existing",
});

const local = (id: string, name: string): ManagedPostImage => ({
  file: new File(["data"], name, { type: "image/jpeg" }),
  id,
  kind: "local",
  previewUrl: `blob:${name}`,
});

describe("mapPostImagesToManaged", () => {
  it("maps post images to existing managed images keyed by media asset id", () => {
    expect(mapPostImagesToManaged([postImage(0), postImage(1)])).toEqual([
      { id: "media-0", imageId: "storage-0", imageUrl: "https://example.com/0.jpg", kind: "existing" },
      { id: "media-1", imageId: "storage-1", imageUrl: "https://example.com/1.jpg", kind: "existing" },
    ]);
  });
});

describe("haveManagedImagesChanged", () => {
  it("reports no change when ids and order match", () => {
    expect(haveManagedImagesChanged([postImage(0), postImage(1)], [existing("media-0"), existing("media-1")])).toBe(
      false,
    );
  });

  it("detects reordering", () => {
    expect(haveManagedImagesChanged([postImage(0), postImage(1)], [existing("media-1"), existing("media-0")])).toBe(
      true,
    );
  });

  it("detects removal and additions", () => {
    expect(haveManagedImagesChanged([postImage(0)], [])).toBe(true);
    expect(haveManagedImagesChanged([], [local("local-1", "new.jpg")])).toBe(true);
  });
});

describe("buildUpdateImagePayload", () => {
  it("builds ordered image order with existing ids and sequential upload file indexes", () => {
    const newFileA = local("local-a", "a.jpg");
    const newFileB = local("local-b", "b.jpg");
    const { files, imageOrder } = buildUpdateImagePayload([existing("media-0"), newFileA, existing("media-1"), newFileB]);

    expect(imageOrder).toEqual([
      { id: "media-0", type: "existing" },
      { fileIndex: 0, type: "upload" },
      { id: "media-1", type: "existing" },
      { fileIndex: 1, type: "upload" },
    ]);
    expect(files).toEqual([
      (newFileA as { file: File }).file,
      (newFileB as { file: File }).file,
    ]);
  });

  it("returns an empty payload when all images are removed", () => {
    expect(buildUpdateImagePayload([])).toEqual({ files: [], imageOrder: [] });
  });
});
