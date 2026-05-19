import type { HttpRequestWithMetadata } from "#common/types/http-request";

export const getRequestDurationMs = (request: HttpRequestWithMetadata) => {
  return typeof request.requestStartedAt === "number" ? Date.now() - request.requestStartedAt : undefined;
};
