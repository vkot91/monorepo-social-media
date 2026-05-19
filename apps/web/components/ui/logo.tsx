import { MessageCircle } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { cn } from "#/lib/utils";

type LogoProps = {
  className?: string;
  href?: Route;
  size?: "default" | "sm";
};

export function Logo({ className, href, size = "default" }: LogoProps) {
  const logo = (
    <span className={cn("inline-flex items-center gap-2.5 text-text", className)}>
      <span
        className={cn(
          "inline-grid shrink-0 place-items-center rounded-lg bg-primary text-on-primary shadow-lg shadow-primary/20",
          size === "sm" ? "h-8 w-8" : "h-10 w-10",
        )}
      >
        <MessageCircle aria-hidden className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <span className={cn("font-extrabold", size === "sm" ? "text-lg" : "text-xl")}>
        Social Media
      </span>
    </span>
  );

  if (!href) {
    return logo;
  }

  return (
    <Link className="inline-flex no-underline" href={href}>
      {logo}
    </Link>
  );
}
