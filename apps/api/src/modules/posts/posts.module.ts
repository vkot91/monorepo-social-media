import { Module } from "@nestjs/common";

import { PaginationModule } from "#common/pagination/pagination.module";

import { PostsController } from "./posts.controller";
import { PostsService } from "./posts.service";

@Module({
  controllers: [PostsController],
  imports: [PaginationModule],
  providers: [PostsService],
})
export class PostsModule {}
