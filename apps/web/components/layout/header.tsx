"use client";

import { LogOut, Search, User, UserCircle } from "lucide-react";

import { AppNavigation, ThemeToggle } from "#/components/layout";
import { DropdownMenu, Logo } from "#/components/ui";
import { Input } from "#/components/ui/form";
import { logout } from "#/lib/api/auth/actions";
import { useAuthStore } from "#/lib/store/auth";
import type { ThemePreference } from "#/lib/theme";

type ProtectedHeaderProps = {
  theme: ThemePreference;
};

export function Header({ theme }: ProtectedHeaderProps) {
  const { user } = useAuthStore();
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3">
        <Logo className="shrink-0 md:hidden" href="/feed" size="sm" />

        <label className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-text"
          />
          <Input
            aria-label="Search"
            className="pl-10"
            placeholder="Search"
            radius="xl"
            type="search"
            variant="bordered"
          />
        </label>

        <ThemeToggle className="w-auto shrink-0" initialTheme={theme} />

        <DropdownMenu
          items={[
            {
              href: "/profile",
              icon: User,
              label: "Profile",
            },
            {
              icon: LogOut,
              label: "Logout",
              onSelect: logout,
              variant: "danger",
            },
          ]}
          label="Open account menu"
          trigger={
            <>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-surface">
                <UserCircle aria-hidden className="h-5 w-5" />
              </span>
              <span className="hidden max-w-28 truncate text-sm font-extrabold sm:inline">{user?.username}</span>
            </>
          }
          triggerClassName="border-0"
        />
      </div>

      <div className="mt-3 md:hidden">
        <AppNavigation layout="topbar" />
      </div>
    </header>
  );
}
