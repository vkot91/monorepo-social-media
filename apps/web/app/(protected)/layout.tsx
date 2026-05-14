import type { ReactNode } from "react";

import { MainLayout } from "#/components/layout/main-layout";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  return <MainLayout>{children}</MainLayout>;
}
