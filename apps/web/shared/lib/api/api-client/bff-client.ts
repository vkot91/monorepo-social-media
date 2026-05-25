import { createApiClient } from "./request";
import type { BffApiRoutes } from "./request.type";

export const bffClient = createApiClient<BffApiRoutes>({
  origin: "bff",
});
