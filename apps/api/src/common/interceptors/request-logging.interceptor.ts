import { type CallHandler, type ExecutionContext, Injectable, Logger, type NestInterceptor } from "@nestjs/common";
import { type Observable } from "rxjs";
import { tap } from "rxjs/operators";

import type { HttpRequestWithMetadata } from "#common/types/http-request";
import { getRequestDurationMs } from "#common/utils/request-duration";
import { getRequestId } from "#common/utils/request-id";

type HttpResponse = {
  statusCode: number;
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<HttpRequestWithMetadata>();
    const response = httpContext.getResponse<HttpResponse>();
    const requestId = getRequestId(request);

    return next.handle().pipe(
      tap(() => {
        this.logger.log({
          durationMs: getRequestDurationMs(request),
          method: request.method ?? "UNKNOWN",
          path: request.url,
          requestId,
          statusCode: response.statusCode,
        });
      }),
    );
  }
}
