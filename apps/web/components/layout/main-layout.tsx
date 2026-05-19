import type { ReactNode } from "react";

import { AppNavigation, Header } from "#/components/layout";
import type { ThemePreference } from "#/lib/theme";

import { Logo } from "../ui";

type MainLayoutProps = {
  children: ReactNode;
  theme: ThemePreference;
};

export const MainLayout = ({ children, theme }: MainLayoutProps) => {
  return (
    <div className="min-h-screen bg-background md:flex">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-line bg-surface/95 px-4 py-5 md:flex">
        <Logo className="mb-8 px-3" href="/feed" />
        <AppNavigation layout="sidebar" />
      </aside>

      <div className="min-w-0 flex-1">
        <Header theme={theme} />
        <main className="mx-auto w-full max-w-6xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
};
