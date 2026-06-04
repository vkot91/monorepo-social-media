import { BadRequestException, Injectable, type PipeTransform } from "@nestjs/common";

import { maxPostImages } from "../inputs/post-image-input.validator";

const maxImageFileSize = 5 * 1024 * 1024;
const supportedImageMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

@Injectable()
export class PostImageFilesPipe implements PipeTransform<Express.Multer.File[] | undefined, Express.Multer.File[]> {
  transform(files: Express.Multer.File[] | undefined): Express.Multer.File[] {
    const images = files ?? [];

    if (images.length > maxPostImages) {
      throw new BadRequestException(`Posts can include at most ${maxPostImages} images`);
    }

    for (const image of images) {
      if (!supportedImageMimeTypes.has(image.mimetype)) {
        throw new BadRequestException("Only JPEG, PNG, and WebP images are supported");
      }

      if (image.size > maxImageFileSize) {
        throw new BadRequestException("Images must be 5MB or smaller");
      }
    }

    return images;
  }
}
