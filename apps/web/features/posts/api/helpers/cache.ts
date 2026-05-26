import type { PaginatedPostsDto, PostDto, UpdatePostInput } from "@social/contracts";
import type { InfiniteData, QueryKey, useQueryClient } from "@tanstack/react-query";

export type PostsInfiniteData = InfiniteData<PaginatedPostsDto>;

export type PostsSnapshot = Array<[QueryKey, PostsInfiniteData | undefined]>;

export const getOptimisticPost = (post: PostDto, input: UpdatePostInput): PostDto => ({
  ...post,
  ...(input.content === undefined ? {} : { content: input.content }),
  ...(input.imageUrl === undefined ? {} : { imageUrl: input.imageUrl }),
  ...(input.visibility === undefined ? {} : { visibility: input.visibility }),
});

export const updatePostInInfiniteData = (data: PostsInfiniteData | undefined, updatedPost: PostDto) =>
  data
    ? {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === updatedPost.id ? updatedPost : item)),
        })),
      }
    : data;

export const removePostFromInfiniteData = (data: PostsInfiniteData | undefined, postId: string) =>
  data
    ? {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== postId),
        })),
      }
    : data;

export const restorePostsSnapshot = (queryClient: ReturnType<typeof useQueryClient>, previousPosts?: PostsSnapshot) => {
  previousPosts?.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};
