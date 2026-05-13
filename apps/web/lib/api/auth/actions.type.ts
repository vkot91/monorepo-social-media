import {
  AuthResponse,
  AuthTokens,
  AuthUserDto,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
} from "@social/contracts";
import { ApiRoute } from "../types";

type AuthedUserResponse = {
  user: AuthUserDto;
};

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

  "/api/auth/login": {
    POST: ApiRoute<{
      auth: false;
      body: LoginInput;
      requestType: "web";
      response: AuthedUserResponse;
    }>;
  };
  "/api/auth/logout": {
    POST: ApiRoute<{
      auth: false;
      requestType: "web";
      response: { ok: true };
    }>;
  };
  "/api/auth/register": {
    POST: ApiRoute<{
      auth: false;
      body: RegisterInput;
      requestType: "web";
      response: AuthedUserResponse;
    }>;
  };
};
