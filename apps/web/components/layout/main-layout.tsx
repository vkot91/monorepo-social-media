import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "#/features/auth/components/logout-button";

type MainLayoutProps = {
  children: ReactNode;
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-stone-100">
      <header className="border-b border-stone-300 bg-stone-50/90">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link className="font-extrabold text-slate-900 no-underline" href="/feed">
            Social Media
          </Link>
          <nav className="flex items-center gap-2" aria-label="Primary navigation">
            <Link
              className="rounded-lg px-3 py-2 text-sm font-bold text-slate-600 no-underline hover:bg-stone-200"
              href="/feed"
            >
              Feed
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl p-5 sm:p-8">{children}</main>
    </div>
  );
};
