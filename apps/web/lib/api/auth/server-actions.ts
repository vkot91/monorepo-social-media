import "server-only";

import type {
  AuthResponse,
  AuthTokens,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
} from "@social/contracts";
import { serverRequest } from "../requests/server-request";

export const authServerApi = {
  login(input: LoginInput) {
    return serverRequest("/auth/login", "POST", {
      body: input,
    });
  },

  logout(input: LogoutInput) {
    return serverRequest("/auth/logout", "POST", {
      body: input,
    });
  },

  refresh(input: RefreshTokenInput) {
    return serverRequest("/auth/refresh", "POST", {
      body: input,
    }) satisfies Promise<AuthTokens>;
  },

  register(input: RegisterInput) {
    return serverRequest("/auth/register", "POST", {
      body: input,
    }) satisfies Promise<AuthResponse>;
  },
};
