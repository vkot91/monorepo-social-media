"use client";

import { useQuery } from "@tanstack/react-query";
import { ReactNode, useEffect } from "react";

import { activeUserQueryOptions } from "#/features/auth/lib/queries";
import { useAuthStore } from "#/lib/store/auth";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { data: user } = useQuery(activeUserQueryOptions());
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    setUser(user ?? null);
  }, [user, setUser]);

  return <>{children}</>;
};
