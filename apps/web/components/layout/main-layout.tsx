import type { ReactNode } from "react";

import { AppLogo } from "#/components/layout/app-logo";
import { AppNavigation } from "#/components/layout/app-navigation";
import { LogoutButton } from "#/features/auth/components/logout-button";

type MainLayoutProps = {
  children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-line bg-surface/95 px-4 py-5 md:flex">
        <AppLogo className="mb-8 px-3" href="/feed" />
        <AppNavigation layout="sidebar" />
        <div className="mt-auto pt-6">
          <LogoutButton className="w-full justify-center" />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="mb-3 flex items-center justify-between gap-3">
            <AppLogo href="/feed" size="sm" />
            <LogoutButton />
          </div>
          <AppNavigation layout="topbar" />
        </header>

        <main className="mx-auto w-full max-w-6xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
};
