import type { LoginInput, RegisterInput } from "@social/contracts";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

export const login = (input: LoginInput) =>
  bffClient("/api/auth/login", "POST", {
    auth: false,
    body: input,
  });

export const register = (input: RegisterInput) =>
  bffClient("/api/auth/register", "POST", {
    auth: false,
    body: input,
  });

export const logout = () =>
  bffClient("/api/auth/logout", "POST", {
    auth: false,
  });
