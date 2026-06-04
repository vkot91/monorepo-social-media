import { Writable } from "node:stream";

import { ServiceUnavailableException } from "@nestjs/common";
import { v2 as cloudinary } from "cloudinary";

import { CloudinaryMediaService } from "./cloudinary-media.service";

jest.mock("cloudinary", () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      destroy: jest.fn(),
      upload_stream: jest.fn(),
    },
  },
}));

jest.mock("#config/env", () => ({
  env: {
    CLOUDINARY_API_KEY: "test-api-key",
    CLOUDINARY_API_SECRET: "test-api-secret",
    CLOUDINARY_CLOUD_NAME: "test-cloud-name",
    CLOUDINARY_MEDIA_FOLDER: "test-folder",
  },
}));

const createImageFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File =>
  ({
    buffer: Buffer.from("image-data"),
    mimetype: "image/png",
    originalname: "test.png",
    size: 1234,
    ...overrides,
  }) as Express.Multer.File;

const makeWritable = () =>
  new Writable({
    write(_chunk, _encoding, done) {
      done();
    },
  });

describe("CloudinaryMediaService", () => {
  let service: CloudinaryMediaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CloudinaryMediaService();
  });

  it("configures cloudinary with env credentials on construction", () => {
    expect(cloudinary.config).toHaveBeenCalledWith({
      api_key: "test-api-key",
      api_secret: "test-api-secret",
      cloud_name: "test-cloud-name",
    });
  });

  it("uploads an image and resolves with storage key and url", async () => {
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
      callback(null, {
        public_id: "test-folder/post-image/user-1/some-uuid",
        secure_url: "https://res.cloudinary.com/test-cloud/image/upload/test.png",
      });
      return makeWritable();
    });

    await expect(service.uploadImage(createImageFile(), "user-1", "post-image")).resolves.toEqual({
      storageKey: "test-folder/post-image/user-1/some-uuid",
      url: "https://res.cloudinary.com/test-cloud/image/upload/test.png",
    });
    expect(cloudinary.uploader.upload_stream).toHaveBeenCalledWith(
      expect.objectContaining({
        folder: "test-folder",
        resource_type: "image",
      }),
      expect.any(Function),
    );
  });

  it("rejects with the cloudinary error when upload fails", async () => {
    const uploadError = new Error("Cloudinary network error");

    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
      callback(uploadError, undefined);
      return makeWritable();
    });

    await expect(service.uploadImage(createImageFile(), "user-1", "post-image")).rejects.toBe(uploadError);
  });

  it("rejects with a default error when upload returns no result", async () => {
    (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation((_options, callback) => {
      callback(null, undefined);
      return makeWritable();
    });

    await expect(service.uploadImage(createImageFile(), "user-1", "post-image")).rejects.toThrow(
      "Cloudinary upload did not return a result",
    );
  });

  it("deletes a stored image file by storage key", async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockResolvedValueOnce({ result: "ok" });

    await expect(service.deleteFile("test-folder/post-image/user-1/some-uuid")).resolves.toBeUndefined();
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("test-folder/post-image/user-1/some-uuid", {
      invalidate: true,
      resource_type: "image",
    });
  });

  it("throws ServiceUnavailableException when file deletion fails", async () => {
    (cloudinary.uploader.destroy as jest.Mock).mockRejectedValueOnce(new Error("Cloudinary deletion failed"));

    await expect(service.deleteFile("test-folder/post-image/user-1/some-uuid")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
