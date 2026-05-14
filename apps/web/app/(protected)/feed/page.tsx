import { redirect } from "next/navigation";
import { Suspense } from "react";

import { Card } from "#/components/ui/card";
import { CreatePostForm, PostsLoadingPlaceholder } from "#/features/posts/components";
import { serverRequest } from "#/lib/api/requests/server-request";
import { AuthRequiredError } from "#/lib/api/utils/errors";

async function getPosts() {
  try {
    return await serverRequest("/posts", "GET", {
      queryParams: {
        feed: "friends",
      },
      retry: {
        attempts: 10,
      },
    });
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      redirect("/login");
    }

    return null;
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
  const posts = await getPosts();

  return (
    <section className="grid gap-4" aria-label="Posts">
      {posts === null ? (
        <Card>
          <h2 className="mb-2 mt-0 text-xl font-extrabold">Feed is temporarily unavailable</h2>
          <p className="m-0 text-muted-text">The API could not be reached. Your session is still protected.</p>
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
    </section>
  );
}
