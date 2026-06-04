import { BadRequestException } from "@nestjs/common";

import { validatePostImageOrderInput } from "./post-image-input.validator";

describe("validatePostImageOrderInput", () => {
  it("accepts ordered existing and uploaded images", () => {
    expect(
      validatePostImageOrderInput([
        {
          type: "existing",
          id: "asset-1",
        },
        {
          type: "upload",
          fileIndex: 0,
        },
      ], 1),
    ).toBeUndefined();
  });

  it("rejects duplicate media asset ids", () => {
    expect(() =>
      validatePostImageOrderInput([
        {
          type: "existing",
          id: "asset-1",
        },
        {
          type: "existing",
          id: "asset-1",
        },
      ], 0),
    ).toThrow(BadRequestException);
  });

  it("rejects duplicate upload indexes", () => {
    expect(() =>
      validatePostImageOrderInput([
        {
          type: "upload",
          fileIndex: 0,
        },
        {
          type: "upload",
          fileIndex: 0,
        },
      ], 1),
    ).toThrow(BadRequestException);
  });

  it("rejects upload indexes without matching files", () => {
    expect(() =>
      validatePostImageOrderInput([
        {
          type: "upload",
          fileIndex: 1,
        },
      ], 1),
    ).toThrow(BadRequestException);
  });

  it("rejects uploaded files missing from image order", () => {
    expect(() =>
      validatePostImageOrderInput([
        {
          type: "upload",
          fileIndex: 0,
        },
      ], 2),
    ).toThrow(BadRequestException);
  });

  it("rejects more than four post images", () => {
    expect(() =>
      validatePostImageOrderInput([
        { type: "existing", id: "asset-1" },
        { type: "existing", id: "asset-2" },
        { type: "existing", id: "asset-3" },
        { type: "existing", id: "asset-4" },
        { type: "existing", id: "asset-5" },
      ], 0),
    ).toThrow(BadRequestException);
  });
});
