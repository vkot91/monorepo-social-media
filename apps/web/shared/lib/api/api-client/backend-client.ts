import { getAccessToken } from "#/shared/lib/api/auth/cookies";

import { createApiClient } from "./request";
import type { BackendApiRoutes } from "./request.type";

export const backendClient = createApiClient<BackendApiRoutes>({
  origin: "backend",
  resolveAccessToken: getAccessToken,
});
