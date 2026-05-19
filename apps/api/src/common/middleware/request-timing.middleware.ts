import { Injectable, type NestMiddleware } from "@nestjs/common";

import type { HttpRequestWithMetadata } from "#common/types/http-request";

type MiddlewareNext = () => void;

@Injectable()
export class RequestTimingMiddleware implements NestMiddleware {
  use(request: HttpRequestWithMetadata, _response: unknown, next: MiddlewareNext) {
    request.requestStartedAt = Date.now();
    next();
  }
}
