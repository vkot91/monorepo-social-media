import type { HTMLAttributes } from "react";
import { cn } from "#/lib/utils";

type CardProps = HTMLAttributes<HTMLElement>;

export const Card = ({ className, ...props }: CardProps) => {
  return (
    <article
      className={cn(
        "rounded-2xl border border-stone-300 bg-stone-50 p-5 shadow-2xl shadow-slate-900/10",
        className,
      )}
      {...props}
    />
  );
};
