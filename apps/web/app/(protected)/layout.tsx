import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { MainLayout } from "#/components/layout/main-layout";
import { getActiveUser } from "#/lib/api/auth";
import { parseThemePreference, themeCookieName } from "#/lib/theme";
import { AuthProvider } from "#/providers/auth-provider";

type ProtectedLayoutProps = {
  children: ReactNode;
};




export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const theme = parseThemePreference((await cookies()).get(themeCookieName)?.value);
  const user = await getActiveUser();

  return (
    <MainLayout theme={theme}>
      <AuthProvider user={user}>{children}</AuthProvider>
    </MainLayout>
  );
}
