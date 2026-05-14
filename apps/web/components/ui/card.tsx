import type { HTMLAttributes } from "react";

import { cn } from "#/lib/utils";

type CardProps = HTMLAttributes<HTMLElement>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <article
      className={cn(
        "rounded-2xl border border-line bg-surface p-5 shadow-2xl shadow-text/10",
        className,
      )}
      {...props}
    />
  );
};
