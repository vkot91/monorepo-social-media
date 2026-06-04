import { Module } from "@nestjs/common";

import { CloudinaryMediaService } from "./services/cloudinary-media.service";
import { MediaAssetsService } from "./services/media-assets.service";
import { PostImagesService } from "./services/post-images.service";

@Module({
  exports: [MediaAssetsService, PostImagesService],
  providers: [
    CloudinaryMediaService,
    MediaAssetsService,
    PostImagesService,
  ],
})
export class MediaModule {}
