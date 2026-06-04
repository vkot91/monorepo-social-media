import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
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
import { validatePostImageOrderInput } from "#modules/media/inputs/post-image-input.validator";
import { MediaAssetsService, type UploadedMediaFile } from "#modules/media/services/media-assets.service";
import { PostImagesService } from "#modules/media/services/post-images.service";

import { visiblePostsWhere } from "./post.where";
import { postWithAuthor, serializePost } from "./posts.serializer";

const postCursorSchema = z.object({
  createdAt: z.string().datetime(),
  id: z.string(),
  version: z.literal(1),
});

@Injectable()
export class PostsService {
  constructor(
    private readonly paginationService: PaginationService,
    private readonly mediaAssetsService: MediaAssetsService,
    private readonly postImagesService: PostImagesService,
  ) {}

  async create(authorId: string, input: CreatePostInput, files: Express.Multer.File[] = []): Promise<PostDto> {
    const post = await this.withUploadedPostImages(authorId, files, (uploadedFiles) =>
      prisma.post.create({
        ...postWithAuthor,
        data: {
          authorId,
          content: input.content,
          ...(uploadedFiles.length === 0
            ? {}
            : {
                images: {
                  create: uploadedFiles.map((uploadedFile, position) => ({
                    mediaAsset: {
                      create: this.mediaAssetsService.toImageAssetCreateData(authorId, uploadedFile),
                    },
                    position,
                  })),
                },
              }),
          visibility: input.visibility ?? PostVisibility.PUBLIC,
        },
      }),
    );

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

  async update(
    authorId: string,
    postId: string,
    input: UpdatePostInput,
    files: Express.Multer.File[] = [],
  ): Promise<PostDto> {
    await this.assertCanMutate(authorId, postId);

    if (input.imageOrder === undefined) {
      if (files.length > 0) {
        throw new BadRequestException("imageOrder is required when uploading images");
      }

      const post = await prisma.post.update({
        ...postWithAuthor,
        data: this.toPostUpdateData(input),
        where: {
          id: postId,
        },
      });

      return serializePost(post);
    }

    const imageOrder = input.imageOrder;

    validatePostImageOrderInput(imageOrder, files.length);

    const transactionResult = await this.withUploadedPostImages(authorId, files, (uploadedFiles) =>
      prisma.$transaction(async (tx) => {
        if (input.content !== undefined || input.visibility !== undefined) {
          await tx.post.update({
            data: this.toPostUpdateData(input),
            where: {
              id: postId,
            },
          });
        }

        const uploadedAssets = await this.mediaAssetsService.createImageAssets(tx, authorId, uploadedFiles);
        const removedAssets = await this.postImagesService.replaceImages(
          tx,
          authorId,
          postId,
          imageOrder,
          uploadedAssets,
        );
        const post = await this.findPostOrThrow(tx, postId);

        return {
          post,
          removedAssets,
        };
      }),
    );

    const { post, removedAssets } = transactionResult;

    await this.mediaAssetsService.deleteStorageFilesBestEffort(removedAssets);

    return serializePost(post);
  }

  async remove(authorId: string, postId: string): Promise<void> {
    await this.assertCanMutate(authorId, postId);

    const removedAssets = await prisma.$transaction(async (tx) => {
      const post = await tx.post.findUnique({
        include: {
          images: {
            include: {
              mediaAsset: true,
            },
          },
        },
        where: {
          id: postId,
        },
      });

      if (!post) {
        throw new NotFoundException("Post not found");
      }

      const mediaAssets = post.images.map((image) => image.mediaAsset);

      await tx.post.delete({
        where: {
          id: postId,
        },
      });

      await this.mediaAssetsService.deleteAssetRows(tx, mediaAssets);

      return mediaAssets;
    });

    await this.mediaAssetsService.deleteStorageFilesBestEffort(removedAssets);
  }

  private async withUploadedPostImages<T>(
    authorId: string,
    files: Express.Multer.File[],
    operation: (uploadedFiles: UploadedMediaFile[]) => Promise<T>,
  ): Promise<T> {
    const uploadedFiles = await this.mediaAssetsService.uploadPostImageFiles(authorId, files);

    try {
      return await operation(uploadedFiles);
    } catch (error) {
      await this.mediaAssetsService.deleteStorageFilesBestEffort(uploadedFiles);
      throw error;
    }
  }

  private findPostOrThrow(tx: Prisma.TransactionClient, postId: string) {
    return tx.post.findUniqueOrThrow({
      ...postWithAuthor,
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

  private toPostUpdateData(input: UpdatePostInput): Prisma.PostUpdateInput {
    return {
      ...(input.content === undefined ? {} : { content: input.content }),
      ...(input.visibility === undefined ? {} : { visibility: input.visibility }),
    };
  }
}
