"use client";

import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UrlObject } from "url";

import { cn } from "#/shared/lib/utils";

export const navigationLinkVariants = cva(
  "group inline-flex items-center gap-3 rounded-lg text-sm font-extrabold no-underline transition-all duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 active:translate-y-0 active:shadow-sm",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        active:
          "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-hover hover:text-on-primary",
        default:
          "text-muted-text hover:-translate-y-0.5 hover:bg-surface hover:text-text hover:shadow-lg hover:shadow-text/10",
      },
    },
  },
);

type NavigationLinkProps = {
  badge?: number;
  href: UrlObject;
  icon: LucideIcon;
  label: string;
  layout: "sidebar" | "topbar";
  path: string;
} & VariantProps<typeof navigationLinkVariants>;

export function NavigationLink({ badge, href, icon: Icon, label, layout, path, variant }: NavigationLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === path || pathname.startsWith(`${path}/`);
  const hasBadge = typeof badge === "number" && badge > 0;

  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      aria-label={hasBadge ? `${label}, ${badge} unread` : undefined}
      className={cn(
        navigationLinkVariants({ variant: isActive ? "active" : variant }),
        layout === "sidebar" ? "min-h-11 w-full px-3.5" : "min-h-10 shrink-0 px-3",
      )}
      href={href}
    >
      <Icon aria-hidden className="h-5 w-5 shrink-0" />
      <span>{label}</span>
      {hasBadge ? (
        <span
          aria-hidden
          className="ml-auto rounded-full bg-danger px-1.5 text-xs font-bold text-on-danger"
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </Link>
  );
}
