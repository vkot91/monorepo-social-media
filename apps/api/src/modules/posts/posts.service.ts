import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreatePostInput,
  ListPostsQueryInput,
  PaginatedPostsDto,
  PostDto,
  UpdatePostInput,
} from "@social/contracts";
import { PostVisibility, type Prisma, prisma } from "@social/database";
import { z } from "zod";

import { PaginationService } from "#common/pagination/pagination.service";

import { visiblePostsWhere } from "./post.where";
import { postWithAuthor, serializePost } from "./posts.serializer";

const postCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string(),
  version: z.literal(1),
});

@Injectable()
export class PostsService {
  constructor(private readonly paginationService: PaginationService) {}

  async create(authorId: string, input: CreatePostInput): Promise<PostDto> {
    const post = await prisma.post.create({
      ...postWithAuthor,
      data: {
        authorId,
        content: input.content,
        imageUrl: input.imageUrl ?? null,
        visibility: input.visibility ?? PostVisibility.PUBLIC,
      },
    });

    return serializePost(post);
  }

  async list(viewerId: string, query: ListPostsQueryInput): Promise<PaginatedPostsDto> {

    return this.listCursor(viewerId, query);
  }

  private async listCursor(viewerId: string, query: ListPostsQueryInput): Promise<PaginatedPostsDto> {
    const pagination = this.paginationService.resolveCursorQuery(query);
   
    const posts = await prisma.post.findMany({
      ...postWithAuthor,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: pagination.limit + 1,
      where: this.withCursorWhere(visiblePostsWhere(viewerId, query), pagination.cursor),
    });

    const page = this.paginationService.buildCursorPage(posts, pagination.limit, (post) => ({
      createdAt: post.createdAt.toISOString(),
      id: post.id,
      version: 1,
    }));

    return {
      items: page.items.map(serializePost),
      pageInfo: page.pageInfo,
    };
  }



  async findOne(authorId: string, postId: string): Promise<PostDto> {
    const post = await prisma.post.findFirst({
      ...postWithAuthor,
      where: {
        authorId,
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    return serializePost(post);
  }

  async update(authorId: string, postId: string, input: UpdatePostInput): Promise<PostDto> {
    await this.assertCanMutate(authorId, postId);

    const post = await prisma.post.update({
      ...postWithAuthor,
      data: {
        ...input,
      },
      where: {
        id: postId,
      },
    });

    return serializePost(post);
  }

  async remove(authorId: string, postId: string): Promise<void> {
    await this.assertCanMutate(authorId, postId);

    await prisma.post.delete({
      where: {
        id: postId,
      },
    });
  }

  private async assertCanMutate(authorId: string, postId: string) {
    const post = await prisma.post.findUnique({
      select: {
        authorId: true,
      },
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException("Post not found");
    }

    if (post.authorId !== authorId) {
      throw new ForbiddenException("You cannot modify this post");
    }
  }

  private withCursorWhere(where: Prisma.PostWhereInput, cursor: string | undefined): Prisma.PostWhereInput {
    if (!cursor) {
      return where;
    }

    const decodedCursor = this.paginationService.decodeCursor(cursor, postCursorSchema);
    const cursorCreatedAt = new Date(decodedCursor.createdAt);

    return {
      AND: [
        where,
        {
          OR: [
            {
              createdAt: {
                lt: cursorCreatedAt,
              },
            },
            {
              createdAt: cursorCreatedAt,
              id: {
                lt: decodedCursor.id,
              },
            },
          ],
        },
      ],
    };
  }
}
