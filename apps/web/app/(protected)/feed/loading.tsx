import { PostsLoadingPlaceholder } from "#/features/posts/components";

export default function Loading() {
  return (
    <>
      <header className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-success">Protected feed</p>
          <h1 className="m-0 text-4xl font-extrabold tracking-normal">Your feed</h1>
        </div>
      </header>

      <PostsLoadingPlaceholder />
    </>
  );
}
