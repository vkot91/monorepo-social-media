import type { AuthTokenPayload } from "./auth-token-payload";

export type AuthenticatedRequest = {
  body?: unknown;
  headers?: {
    authorization?: string | string[];
  };
  user?: AuthTokenPayload;
};
