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
} from "@nestjs/common";
import {
  createPostSchema,
  listPostsQuerySchema,
  updatePostSchema,
  type CreatePostInput,
  type ListPostsQueryInput,
  type UpdatePostInput,
} from "@social/contracts";

import { ZodValidationPipe } from "#common/pipes/zod-validation.pipe";
import { CurrentUser } from "#modules/auth/decorators/current-user.decorator";
import type { AuthTokenPayload } from "#modules/auth/types/auth-token-payload";
import { PostsService } from "./posts.service";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @HttpPost()
  create(
    @CurrentUser() user: AuthTokenPayload,
    @Body(new ZodValidationPipe(createPostSchema)) input: CreatePostInput,
  ) {
    return this.postsService.create(user.sub, input);
  }

  @Get()
  list(
    @CurrentUser() user: AuthTokenPayload,
    @Query(new ZodValidationPipe(listPostsQuerySchema)) query: ListPostsQueryInput,
  ) {
    return this.postsService.list(user.sub, query);
  }

  @Get(":id")
  findOne(@CurrentUser() user: AuthTokenPayload, @Param("id") postId: string) {
    return this.postsService.findOne(user.sub, postId);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthTokenPayload,
    @Param("id") postId: string,
    @Body(new ZodValidationPipe(updatePostSchema)) input: UpdatePostInput,
  ) {
    return this.postsService.update(user.sub, postId, input);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(":id")
  remove(@CurrentUser() user: AuthTokenPayload, @Param("id") postId: string) {
    return this.postsService.remove(user.sub, postId);
  }
}
