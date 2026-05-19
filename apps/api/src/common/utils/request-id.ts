import { randomUUID } from "node:crypto";

import type { HttpRequestWithMetadata } from "#common/types/http-request";

export const getRequestId = (request: Pick<HttpRequestWithMetadata, "headers">) => {
  const requestId = request.headers?.["x-request-id"];

  return typeof requestId === "string" ? requestId : randomUUID();
};
