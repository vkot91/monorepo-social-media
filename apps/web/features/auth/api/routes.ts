import type {
  AuthResponse,
  AuthTokens,
  AuthUserDto,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
} from "@social/contracts";

import type { ApiRoute } from "#/shared/lib/api/types";

export type AuthBackendApiRoutes = {
  "/auth/login": {
    POST: ApiRoute<{
      auth: false;
      body: LoginInput;
      response: AuthResponse;
    }>;
  };
  "/auth/logout": {
    POST: ApiRoute<{
      auth: false;
      body: LogoutInput;
      response: null;
    }>;
  };
  "/auth/me": {
    GET: ApiRoute<{
      response: AuthUserDto;
    }>;
  };
  "/auth/refresh": {
    POST: ApiRoute<{
      auth: false;
      body: RefreshTokenInput;
      response: AuthTokens;
    }>;
  };
  "/auth/register": {
    POST: ApiRoute<{
      auth: false;
      body: RegisterInput;
      response: AuthResponse;
    }>;
  };
};

export type AuthBffApiRoutes = {
  "/api/auth/login": {
    POST: ApiRoute<{
      auth: false;
      body: LoginInput;
      response: null;
    }>;
  };
  "/api/auth/logout": {
    POST: ApiRoute<{
      auth: false;
      response: null;
    }>;
  };
  "/api/auth/me": {
    GET: ApiRoute<{
      response: AuthUserDto;
    }>;
  };
  "/api/auth/refresh": {
    POST: ApiRoute<{
      auth: false;
      response: null;
    }>;
  };
  "/api/auth/register": {
    POST: ApiRoute<{
      auth: false;
      body: RegisterInput;
      response: null;
    }>;
  };
};

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};
