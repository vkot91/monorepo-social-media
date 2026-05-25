import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { MainLayout } from "#/shared/layout/main-layout";
import { parseThemePreference, themeCookieName } from "#/shared/lib/theme";
import { AuthProvider } from "#/shared/providers/auth-provider";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const theme = parseThemePreference((await cookies()).get(themeCookieName)?.value);

  return (
    <MainLayout theme={theme}>
      <AuthProvider>{children}</AuthProvider>
    </MainLayout>
  );
}
