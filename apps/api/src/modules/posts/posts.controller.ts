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
  UseInterceptors,
} from "@nestjs/common";
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

import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  @UseInterceptors(ZodResponseInterceptor(PostSchema))
  async create(
    @CurrentUser() user: AuthTokenPayload,
    @Body(new ZodValidationPipe(createPostSchema)) input: CreatePostInput,
  ) {
    return this.postsService.create(user.sub, input);
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
  @UseInterceptors(ZodResponseInterceptor(PostSchema))
  async update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") postId: string,
    @Body(new ZodValidationPipe(updatePostSchema)) input: UpdatePostInput,
  ) {
    await delay(1_000);

    return this.postsService.update(user.sub, postId, input);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(@CurrentUser() user: AuthTokenPayload, @Param("id") postId: string) {
    return this.postsService.remove(user.sub, postId);
  }
}
