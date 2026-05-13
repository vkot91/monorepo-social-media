import type { ReactNode } from "react";
import { AuthLayout as AuthLayoutComponent } from "#/components/layout/auth-layout";

type AuthLayoutProps = {
  children: ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return <AuthLayoutComponent>{children}</AuthLayoutComponent>;
}
