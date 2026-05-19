import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card } from "#/components/ui/card";
import { CreatePostForm, PostsLoadingPlaceholder } from "#/features/posts/components";
import { serverRequest } from "#/lib/api/requests/server-request";
import { ApiRequestError, AuthRequiredError } from "#/lib/api/utils/errors";

export const metadata = {
  title: "Feed",
};

async function getPosts() {
  try {
    const posts = await serverRequest("/posts", "GET", {
      queryParams: {
        feed: "friends",
      },
      retry: {
        attempts: 3,
      },
    });

    return {
      posts,
      status: "success" as const,
    };
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }

    return {
      message: error instanceof ApiRequestError ? error.message : "Feed is temporarily unavailable.",
      status: "error" as const,
    };
  }
}

export default function FeedPage() {
  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-success">Protected feed</p>
          <h1 className="m-0 text-4xl font-extrabold tracking-normal">Your feed</h1>
        </div>
      </header>
      <div className="mb-4">
        <CreatePostForm />
      </div>
      <Suspense fallback={<PostsLoadingPlaceholder />}>
        <FeedPosts />
      </Suspense>
    </>
  );
}

export async function FeedPosts() {
  const result = await getPosts();

  return (
    <section className="grid gap-4" aria-label="Posts">
      {result.status === "error" ? (
        <Card>
          <h2 className="mb-2 mt-0 text-xl font-extrabold">Feed is temporarily unavailable</h2>
          <p className="m-0 text-muted-text">{result.message}</p>
        </Card>
      ) : result.posts.length > 0 ? (
        result.posts.map((post) => (
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
    </section>
  );
}
