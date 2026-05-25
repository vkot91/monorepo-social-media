import type { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <main className="grid min-h-screen place-items-center content-center gap-5 p-5 sm:p-8">
      <div className="grid w-full justify-items-center gap-5">{children}</div>
    </main>
  );
}
