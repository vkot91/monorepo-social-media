"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { type ComponentProps, type ReactNode, useId, useRef, useState } from "react";

import { Button, buttonVariants } from "#/components/ui/button";
import { useOutsideClick } from "#/hooks/use-outside-click";
import { cn } from "#/lib/utils";

type DropdownMenuItemBase = {
  icon?: LucideIcon;
  label: string;
  variant?: "default" | "danger";
};

type DropdownMenuActionItem = DropdownMenuItemBase & {
  onSelect: () => unknown | Promise<unknown>;
};

type DropdownMenuLinkItem = DropdownMenuItemBase & {
  href: ComponentProps<typeof Link>["href"];
};

export type DropdownMenuItem = DropdownMenuActionItem | DropdownMenuLinkItem;

type DropdownMenuProps = {
  align?: "start" | "end";
  className?: string;
  items: DropdownMenuItem[];
  label: string;
  trigger: ReactNode;
  triggerClassName?: string;
};

function isDropdownMenuLinkItem(item: DropdownMenuItem): item is DropdownMenuLinkItem {
  return "href" in item;
}

export function DropdownMenu({ align = "end", className, items, label, trigger, triggerClassName }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | HTMLButtonElement | null>>([]);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  function focusItem(index: number) {
    window.requestAnimationFrame(() => {
      itemRefs.current[index]?.focus();
    });
  }

  function openMenu(focusIndex = 0) {
    setOpen(true);
    focusItem(focusIndex);
  }

  function closeMenu({ restoreFocus = true } = {}) {
    setOpen(false);

    if (restoreFocus) {
      window.requestAnimationFrame(() => buttonRef.current?.focus());
    }
  }

  function focusNextItem(direction: 1 | -1) {
    const activeIndex = itemRefs.current.findIndex((item) => item === document.activeElement);
    const nextIndex = activeIndex === -1 ? 0 : (activeIndex + direction + items.length) % items.length;

    itemRefs.current[nextIndex]?.focus();
  }

  useOutsideClick({
    enabled: open,
    onOutsideClick: () => closeMenu({ restoreFocus: false }),
    ref: rootRef,
  });

  return (
    <div className={cn("relative", className)} ref={rootRef}>
      <Button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={triggerClassName}
        onClick={() => {
          if (open) {
            closeMenu();
          } else {
            openMenu();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openMenu();
          }

          if (event.key === "ArrowUp") {
            event.preventDefault();
            openMenu(items.length - 1);
          }
        }}
        ref={buttonRef}
        variant="secondary"
      >
        {trigger}
      </Button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-30 mt-2 grid min-w-44 gap-1 rounded-xl border border-line bg-surface p-1 shadow-2xl shadow-text/10",
            align === "end" ? "right-0" : "left-0",
          )}
          id={menuId}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeMenu();
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              focusNextItem(1);
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              focusNextItem(-1);
            }

            if (event.key === "Home") {
              event.preventDefault();
              itemRefs.current[0]?.focus();
            }

            if (event.key === "End") {
              event.preventDefault();
              itemRefs.current[items.length - 1]?.focus();
            }
          }}
          role="menu"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            const linkItemClassName = cn(
              buttonVariants({ variant: "menu" }),
              item.variant === "danger" && "text-danger",
            );
            const content = (
              <>
                {Icon ? <Icon aria-hidden className="h-4 w-4 shrink-0" /> : null}
                <span>{item.label}</span>
              </>
            );

            if (isDropdownMenuLinkItem(item)) {
              return (
                <Link
                  className={linkItemClassName}
                  href={item.href}
                  key={item.label}
                  onClick={() => closeMenu({ restoreFocus: false })}
                  ref={(node) => {
                    itemRefs.current[index] = node;
                  }}
                  role="menuitem"
                  tabIndex={-1}
                >
                  {content}
                </Link>
              );
            }

            return (
              <Button
                className={item.variant === "danger" ? "text-danger" : undefined}
                key={item.label}
                onClick={async () => {
                  closeMenu({ restoreFocus: false });
                  await item.onSelect();
                }}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                role="menuitem"
                tabIndex={-1}
                variant="menu"
              >
                {content}
              </Button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
