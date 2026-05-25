import type { ReactNode } from "react";

import { AuthLayout as AuthLayoutComponent } from "#/shared/layout/auth-layout";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AuthLayoutComponent>{children}</AuthLayoutComponent>;
}
