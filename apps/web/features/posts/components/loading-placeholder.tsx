import { LoaderCircle } from "lucide-react";

import { Card } from "#/shared/ui";

interface PostsLoadingPlaceholderProps {
  rowsCount?: number;
}

interface PostLoadingPlaceholderProps {
  statusText?: string;
}

export const PostLoadingPlaceholder = ({ statusText }: PostLoadingPlaceholderProps) => (
  <Card className="relative grid gap-4 overflow-hidden" aria-busy={statusText ? "true" : undefined}>
    <div className="flex items-center gap-3.5">
      <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-skeleton" />
      <div className="grid flex-1 gap-2">
        <div className="h-4 w-36 animate-pulse rounded bg-skeleton" />
        <div className="h-3 w-24 animate-pulse rounded bg-skeleton-muted" />
      </div>
    </div>
    <div className="grid gap-2">
      <div className="h-4 w-full animate-pulse rounded bg-skeleton-muted" />
      <div className="h-4 w-2/3 animate-pulse rounded bg-skeleton-muted" />
    </div>
    {statusText ? (
      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-surface/75" role="status">
        <LoaderCircle aria-hidden className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm font-bold text-text">{statusText}</span>
      </div>
    ) : null}
  </Card>
);

export const PostsLoadingPlaceholder = ({ rowsCount = 3 }: PostsLoadingPlaceholderProps) => {
  const cards = Array.from({ length: rowsCount }, (_, i) => i);

  return (
    <div className="grid gap-4">
      {cards.map((_, i) => (
        <section key={i} className="grid gap-4" aria-label="Posts loading">
          <PostLoadingPlaceholder />
        </section>
      ))}
    </div>
  );
};
