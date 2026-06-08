import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { MessagingSocketProvider } from "#/features/messaging/providers/messaging-socket-provider";
import { MainLayout } from "#/shared/layout/main-layout";
import { parseThemePreference, themeCookieName } from "#/shared/lib/theme";
import { RealtimeProvider } from "#/shared/providers/realtime-provider";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const theme = parseThemePreference((await cookies()).get(themeCookieName)?.value);

  return (
    <MainLayout theme={theme}>
      <RealtimeProvider>
        <MessagingSocketProvider>{children}</MessagingSocketProvider>
      </RealtimeProvider>
    </MainLayout>
  );
}
