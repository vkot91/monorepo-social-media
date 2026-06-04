import type { PaginatedPostsDto, PostDto } from "@social/contracts";
import { describe, expect, it, vi } from "vitest";

import {
  addPostToInfiniteData,
  type PostsInfiniteData,
  type PostsSnapshot,
  removePostFromInfiniteData,
  restorePostsSnapshot,
  updatePostInInfiniteData,
} from "./cache";

const buildPost = (overrides: Partial<PostDto> = {}): PostDto => ({
  author: {
    avatarUrl: null,
    displayName: "Maya Johnson",
    id: "author-1",
    username: "maya",
  },
  content: "Post content",
  createdAt: "2026-05-08T10:00:00.000Z",
  id: "post-1",
  images: [],
  updatedAt: "2026-05-08T10:00:00.000Z",
  visibility: "PUBLIC",
  ...overrides,
});

const buildPage = (items: PostDto[]): PaginatedPostsDto => ({
  items,
  pageInfo: {
    hasNextPage: false,
    limit: 20,
    mode: "cursor",
    nextCursor: null,
  },
});

const buildInfiniteData = (pages: PaginatedPostsDto[]): PostsInfiniteData => ({
  pageParams: pages.map((_, i) => (i === 0 ? null : `cursor-${i}`)),
  pages,
});

describe("addPostToInfiniteData", () => {
  it("prepends a new post to the first page", () => {
    const existingPost = buildPost({ id: "post-1" });
    const newPost = buildPost({ id: "post-2", content: "New post" });
    const data = buildInfiniteData([buildPage([existingPost])]);

    const result = addPostToInfiniteData(data, newPost);

    expect(result?.pages[0]?.items[0]).toEqual(newPost);
    expect(result?.pages[0]?.items[1]).toEqual(existingPost);
  });

  it("deduplicates if the new post already exists in the first page", () => {
    const post = buildPost({ id: "post-1" });
    const data = buildInfiniteData([buildPage([post])]);

    const result = addPostToInfiniteData(data, post);

    expect(result?.pages[0]?.items).toHaveLength(1);
    expect(result?.pages[0]?.items[0]).toEqual(post);
  });

  it("only prepends to the first page, leaving subsequent pages unchanged", () => {
    const page1Post = buildPost({ id: "post-1" });
    const page2Post = buildPost({ id: "post-2" });
    const newPost = buildPost({ id: "post-3", content: "New post" });
    const data = buildInfiniteData([buildPage([page1Post]), buildPage([page2Post])]);

    const result = addPostToInfiniteData(data, newPost);

    expect(result?.pages[0]?.items[0]).toEqual(newPost);
    expect(result?.pages[1]?.items).toEqual([page2Post]);
  });

  it("returns undefined unchanged when data is undefined", () => {
    expect(addPostToInfiniteData(undefined, buildPost())).toBeUndefined();
  });
});

describe("updatePostInInfiniteData", () => {
  it("replaces an updated post across all pages", () => {
    const oldPost = buildPost({ id: "post-1", content: "Old content" });
    const updatedPost = buildPost({ id: "post-1", content: "New content" });
    const data = buildInfiniteData([buildPage([oldPost])]);

    const result = updatePostInInfiniteData(data, updatedPost);

    expect(result?.pages[0]?.items[0]).toEqual(updatedPost);
  });

  it("updates matching post on a later page", () => {
    const page1Post = buildPost({ id: "post-1" });
    const page2Post = buildPost({ id: "post-2", content: "Old content" });
    const updatedPost = buildPost({ id: "post-2", content: "Updated content" });
    const data = buildInfiniteData([buildPage([page1Post]), buildPage([page2Post])]);

    const result = updatePostInInfiniteData(data, updatedPost);

    expect(result?.pages[1]?.items[0]).toEqual(updatedPost);
    expect(result?.pages[0]?.items[0]).toEqual(page1Post);
  });

  it("returns undefined unchanged when data is undefined", () => {
    expect(updatePostInInfiniteData(undefined, buildPost())).toBeUndefined();
  });
});

describe("removePostFromInfiniteData", () => {
  it("removes a post by id from all pages", () => {
    const post1 = buildPost({ id: "post-1" });
    const post2 = buildPost({ id: "post-2" });
    const data = buildInfiniteData([buildPage([post1, post2])]);

    const result = removePostFromInfiniteData(data, "post-1");

    expect(result?.pages[0]?.items).toEqual([post2]);
  });

  it("removes matching post from a later page", () => {
    const page1Post = buildPost({ id: "post-1" });
    const page2Post = buildPost({ id: "post-2" });
    const data = buildInfiniteData([buildPage([page1Post]), buildPage([page2Post])]);

    const result = removePostFromInfiniteData(data, "post-2");

    expect(result?.pages[0]?.items).toEqual([page1Post]);
    expect(result?.pages[1]?.items).toEqual([]);
  });

  it("returns undefined unchanged when data is undefined", () => {
    expect(removePostFromInfiniteData(undefined, "post-1")).toBeUndefined();
  });
});

describe("restorePostsSnapshot", () => {
  it("restores all query data entries from the snapshot", () => {
    const queryClient = {
      setQueryData: vi.fn(),
    };
    const snapshot: PostsSnapshot = [
      [["posts", "feed"], buildInfiniteData([buildPage([buildPost()])])],
      [["posts", "other"], undefined],
    ];

    restorePostsSnapshot(queryClient as never, snapshot);

    expect(queryClient.setQueryData).toHaveBeenCalledTimes(2);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(snapshot[0]![0], snapshot[0]![1]);
    expect(queryClient.setQueryData).toHaveBeenCalledWith(snapshot[1]![0], snapshot[1]![1]);
  });

  it("does nothing when previousPosts is undefined", () => {
    const queryClient = { setQueryData: vi.fn() };

    restorePostsSnapshot(queryClient as never, undefined);

    expect(queryClient.setQueryData).not.toHaveBeenCalled();
  });
});
