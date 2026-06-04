import type { PaginatedPostsDto, PostDto } from "@social/contracts";
import type { InfiniteData, QueryKey, useQueryClient } from "@tanstack/react-query";

export type PostsInfiniteData = InfiniteData<PaginatedPostsDto>;

export type PostsSnapshot = Array<[QueryKey, PostsInfiniteData | undefined]>;

export const addPostToInfiniteData = (data: PostsInfiniteData | undefined, createdPost: PostDto) =>
  data
    ? {
        ...data,
        pages: data.pages.map((page, index) =>
          index === 0
            ? {
                ...page,
                items: [createdPost, ...page.items.filter((item) => item.id !== createdPost.id)],
              }
            : page,
        ),
      }
    : data;

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
