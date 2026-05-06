import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type {
  CreatePostInput,
  ListPostsQueryInput,
  PostDto,
  UpdatePostInput,
} from "@social/contracts";
import { PostVisibility, prisma, type Prisma } from "@social/database";

import { visiblePostsWhere } from "./post.where";

const postWithAuthor = {
  include: {
    author: {
      select: {
        avatarUrl: true,
        displayName: true,
        id: true,
        username: true,
      },
    },
  },
} satisfies Prisma.PostDefaultArgs;

type PostWithAuthor = Prisma.PostGetPayload<typeof postWithAuthor>;

@Injectable()
export class PostsService {
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

  async list(viewerId: string, query: ListPostsQueryInput): Promise<PostDto[]> {
    const posts = await prisma.post.findMany({
      ...postWithAuthor,
      orderBy: {
        createdAt: "desc",
      },
      where: visiblePostsWhere(viewerId, query),
    });

    return posts.map(serializePost);
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
}

function serializePost(post: PostWithAuthor): PostDto {
  return {
    author: post.author,
    content: post.content,
    createdAt: post.createdAt.toISOString(),
    id: post.id,
    imageUrl: post.imageUrl,
    updatedAt: post.updatedAt.toISOString(),
    visibility: post.visibility,
  };
}
