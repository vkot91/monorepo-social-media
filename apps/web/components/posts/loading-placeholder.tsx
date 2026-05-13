import { Card } from "../ui/card";

interface PostsLoadingPlaceholderProps {
  rowsCount?: number;
}

export const PostsLoadingPlaceholder = ({ rowsCount = 3 }: PostsLoadingPlaceholderProps) => {
  const cards = Array.from({ length: rowsCount }, (_, i) => i);

  return (
    <div className="grid gap-4">
      {cards.map((_, i) => (
        <section key={i} className="grid gap-4" aria-label="Posts loading">
          <Card className="grid gap-4">
            <div className="flex items-center gap-3.5">
              <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-stone-300" />
              <div className="grid flex-1 gap-2">
                <div className="h-4 w-36 animate-pulse rounded bg-stone-300" />
                <div className="h-3 w-24 animate-pulse rounded bg-stone-200" />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200" />
            </div>
          </Card>
        </section>
      ))}
    </div>
  );
};
