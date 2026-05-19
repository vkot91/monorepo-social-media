import { PostFeed } from "@social/contracts";

import { Card } from "#/components/ui";
import { getPosts } from "#/lib/api/posts/queries";

interface PostListProps {
  feedType: PostFeed;
}

export const PostsList = async ({ feedType }: PostListProps) => {
  const result = await getPosts(feedType);

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
};
