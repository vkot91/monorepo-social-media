import { Suspense } from "react";

import { CreatePostForm } from "#/features/posts/components/create-post-form";
import { PostsLoadingPlaceholder } from "#/features/posts/components/loading-placeholder";
import { PostsList } from "#/features/posts/components/posts-list";

export const metadata = {
  title: "Feed",
};

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
        <PostsList feedType="all" />
      </Suspense>
    </>
  );
}
