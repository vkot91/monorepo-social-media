import { getAccessToken } from "#/lib/api/auth/cookies";

import { createRequest } from "./base-request";

export const serverRequest = createRequest({
  resolveAccessToken: getAccessToken,
});
