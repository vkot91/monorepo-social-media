"use client";

import { PostFeed } from "@social/contracts";
import { useInfiniteQuery } from "@tanstack/react-query";
import { LoaderCircle } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { Card } from "#/components/ui";

import { postsInfiniteQueryOptions } from "../lib/queries";
import { PostsLoadingPlaceholder } from "./loading-placeholder";

interface PostListProps {
  feedType: PostFeed;
}

export const PostsList = ({ feedType }: PostListProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isLoading } = useInfiniteQuery(
    postsInfiniteQueryOptions({
      feed: feedType,
      mode: "cursor",
    }),
  );
  const posts = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);

  useEffect(() => {
    if (!hasNextPage || isFetching || typeof IntersectionObserver === "undefined") {
      return;
    }

    const target = loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect();
          void fetchNextPage();
        }
      },
      {
        rootMargin: "200px",
      },
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [fetchNextPage, hasNextPage, isFetching]);

  if (isLoading) {
    return <PostsLoadingPlaceholder />;
  }

  return (
    <section className="grid gap-4" aria-label="Posts">
      {error ? (
        <Card>
          <h2 className="mb-2 mt-0 text-xl font-extrabold">Feed is temporarily unavailable</h2>
          <p className="m-0 text-muted-text">
            {error instanceof Error ? error.message : "Feed is temporarily unavailable."}
          </p>
        </Card>
      ) : posts.length > 0 ? (
        posts.map((post) => (
          <Card className="grid gap-4" key={post.id}>
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 shrink-0 rounded-full bg-warning" />
              <div>
                <strong>{post.author.displayName}</strong>
                <p className="mt-1 text-muted-text">@{post.author.username}</p>
              </div>
            </div>
            <p>{post.content}</p>
          </Card>
        ))
      ) : (
        <Card>
          <h2 className="mb-2 mt-0 text-xl font-extrabold">No posts yet</h2>
          <p className="m-0 text-muted-text">
            This placeholder is ready for the feed once post creation UI is connected.
          </p>
        </Card>
      )}
      {posts.length > 0 && hasNextPage && (
        <>
          <div aria-hidden className="h-px" ref={loadMoreRef} data-testid="posts-load-more-sentinel" />
          {isFetchingNextPage && (
            <p className="flex justify-center items-center gap-4" role="status">
              Loading more posts... <LoaderCircle aria-hidden className="mr-2 h-4 w-4 animate-spin" />
            </p>
          )}
        </>
      )}
    </section>
  );
};
