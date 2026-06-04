import { BadRequestException } from "@nestjs/common";

import { PostImageFilesPipe } from "./post-image-files.pipe";

const createFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
  ({
    buffer: Buffer.from("data"),
    mimetype: "image/jpeg",
    originalname: "photo.jpg",
    size: 1024,
    ...overrides,
  }) as Express.Multer.File;

describe("PostImageFilesPipe", () => {
  let pipe: PostImageFilesPipe;

  beforeEach(() => {
    pipe = new PostImageFilesPipe();
  });

  it("passes through an empty array when no files are provided", () => {
    expect(pipe.transform(undefined)).toEqual([]);
  });

  it("passes through valid image files unchanged", () => {
    const files = [
      createFile({ mimetype: "image/jpeg" }),
      createFile({ mimetype: "image/png" }),
      createFile({ mimetype: "image/webp" }),
    ];

    expect(pipe.transform(files)).toBe(files);
  });

  it("throws BadRequestException when more than the max number of images are submitted", () => {
    const files = Array.from({ length: 11 }, () => createFile());

    expect(() => pipe.transform(files)).toThrow(BadRequestException);
    expect(() => pipe.transform(files)).toThrow(/at most/i);
  });

  it("throws BadRequestException for unsupported mime types", () => {
    const files = [createFile({ mimetype: "image/gif" })];

    expect(() => pipe.transform(files)).toThrow(BadRequestException);
    expect(() => pipe.transform(files)).toThrow(/JPEG, PNG, and WebP/i);
  });

  it("throws BadRequestException when an image exceeds 5 MB", () => {
    const files = [createFile({ size: 5 * 1024 * 1024 + 1 })];

    expect(() => pipe.transform(files)).toThrow(BadRequestException);
    expect(() => pipe.transform(files)).toThrow(/5MB/i);
  });

  it("accepts images exactly at the 5 MB size limit", () => {
    const files = [createFile({ size: 5 * 1024 * 1024 })];

    expect(pipe.transform(files)).toBe(files);
  });
});
