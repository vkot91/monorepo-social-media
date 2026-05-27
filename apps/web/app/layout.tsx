import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { authKeys } from "#/features/auth/api/routes";
import { backendClient } from "#/shared/lib/api/api-client/backend-client";
import { getThemeAttribute, parseThemePreference, themeCookieName } from "#/shared/lib/theme";
import { QueryProvider } from "#/shared/providers/query-provider";
import { ToastViewport } from "#/shared/ui";

import "./globals.css";

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const queryClient = new QueryClient();

  const theme = parseThemePreference((await cookies()).get(themeCookieName)?.value);
  const themeAttribute = getThemeAttribute(theme);

  await queryClient.prefetchQuery({
    queryKey: authKeys.me(),
    queryFn: () => backendClient("/auth/me", "GET", {}),
    staleTime: 60_000,
  });

  return (
    <html data-theme={themeAttribute} lang="en">
      <body>
        <QueryProvider>
          <HydrationBoundary state={dehydrate(queryClient)}>
            {children}
            <ToastViewport />
          </HydrationBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
