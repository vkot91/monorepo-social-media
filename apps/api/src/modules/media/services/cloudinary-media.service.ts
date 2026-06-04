import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { MediaUploadPurpose } from "@social/contracts";
import { type UploadApiResponse, v2 as cloudinary } from "cloudinary";

import { env } from "#config/env";

type UploadedImage = {
  storageKey: string;
  url: string;
};

@Injectable()
export class CloudinaryMediaService {
  constructor() {
    cloudinary.config({
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
    });
  }

  uploadImage(file: Express.Multer.File, ownerId: string, purpose: MediaUploadPurpose): Promise<UploadedImage> {
    const publicId = `${purpose}/${ownerId}/${randomUUID()}`;

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: env.CLOUDINARY_MEDIA_FOLDER,
          public_id: publicId,
          resource_type: "image",
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error("Cloudinary upload did not return a result"));
            return;
          }

          resolve(this.toUploadedImage(result));
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async deleteFile(storageKey: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(storageKey, {
        resource_type: "image",
        invalidate: true,
      });
    } catch (error) {
      throw new ServiceUnavailableException(error);
    }
  }

  private toUploadedImage(result: UploadApiResponse): UploadedImage {
    return {
      storageKey: result.public_id,
      url: result.secure_url,
    };
  }
}
