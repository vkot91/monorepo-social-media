import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { getThemeAttribute, parseThemePreference, themeCookieName } from "#/lib/theme";

import "./globals.css";

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const theme = parseThemePreference((await cookies()).get(themeCookieName)?.value);
  const themeAttribute = getThemeAttribute(theme);

  return (
    <html data-theme={themeAttribute} lang="en">
      <body>{children}</body>
    </html>
  );
}
