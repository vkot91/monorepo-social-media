import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post as HttpPost,
  Query,
  UploadedFiles,
  UseInterceptors,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  type CreatePostInput,
  createPostSchema,
  type ListPostsQueryInput,
  listPostsQuerySchema,
  PaginatedPostsSchema,
  PostSchema,
  type UpdatePostInput,
  updatePostSchema,
} from "@social/contracts";

import { ZodResponseInterceptor } from "#common/interceptors/response.interceptor";
import { ZodValidationPipe } from "#common/pipes/zod-validation.pipe";
import { delay } from "#common/utils/delay";
import { CurrentUser } from "#modules/auth/decorators/current-user.decorator";
import type { AuthTokenPayload } from "#modules/auth/types/auth-token-payload";
import { maxPostImages } from "#modules/media/inputs/post-image-input.validator";
import { PostImageFilesPipe } from "#modules/media/pipes/post-image-files.pipe";

import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @UseInterceptors(FilesInterceptor("images", maxPostImages))
  @UseInterceptors(ZodResponseInterceptor(PostSchema))
  async create(
    @CurrentUser() user: AuthTokenPayload,
    @Body(new ZodValidationPipe(createPostSchema)) input: CreatePostInput,
    @UploadedFiles(new PostImageFilesPipe()) files: Express.Multer.File[],
  ) {
    await delay(1_000);
    return this.postsService.create(user.sub, input, files);
  }

  @Get()
  @UseInterceptors(ZodResponseInterceptor(PaginatedPostsSchema))
  async list(
    @CurrentUser() user: AuthTokenPayload,
    @Query(new ZodValidationPipe(listPostsQuerySchema)) query: ListPostsQueryInput,
  ) {
    await delay(2_000);

    return await this.postsService.list(user.sub, query);
  }

  @Get(":id")
  @UseInterceptors(ZodResponseInterceptor(PostSchema))
  findOne(@CurrentUser() user: AuthTokenPayload, @Param("id") postId: string) {
    return this.postsService.findOne(user.sub, postId);
  }

  @Patch(":id")
  @UseInterceptors(FilesInterceptor("images", maxPostImages))
  @UseInterceptors(ZodResponseInterceptor(PostSchema))
  async update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") postId: string,
    @Body(new ZodValidationPipe(updatePostSchema)) input: UpdatePostInput,
    @UploadedFiles(new PostImageFilesPipe()) files: Express.Multer.File[],
  ) {
    await delay(1_000);

    return this.postsService.update(user.sub, postId, input, files);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(@CurrentUser() user: AuthTokenPayload, @Param("id") postId: string) {
    return this.postsService.remove(user.sub, postId);
  }
}
