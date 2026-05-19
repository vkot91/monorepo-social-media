"use client";

import { AuthUserDto } from "@social/contracts";
import { ReactNode, useEffect } from "react";

import { useAuthStore } from "#/lib/store/auth";

interface AuthProviderProps {
  user: AuthUserDto | null;
  children: ReactNode;
}

export const AuthProvider = ({ user, children }: AuthProviderProps) => {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    setUser(user ?? null);
  }, [user, setUser]);

  return <>{children}</>;
};
