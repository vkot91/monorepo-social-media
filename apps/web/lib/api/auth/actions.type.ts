import {
  AuthResponse,
  AuthTokens,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
} from "@social/contracts";

import { ApiRoute } from "../types";

export type AuthApiRoutes = {
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
