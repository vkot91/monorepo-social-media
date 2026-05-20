import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from "@nestjs/common";
import { type Observable } from "rxjs";
import { tap } from "rxjs/operators";

import { LoggingService } from "#common/logging/logging.service";
import type { HttpRequestWithMetadata } from "#common/types/http-request";
import { getRequestDurationMs } from "#common/utils/request-duration";
import { getRequestId } from "#common/utils/request-id";

type HttpResponse = {
  statusCode: number;
};

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<HttpRequestWithMetadata>();
    const response = httpContext.getResponse<HttpResponse>();
    const requestId = getRequestId(request);

    return next.handle().pipe(
      tap(() => {
        this.loggingService.log(RequestLoggingInterceptor.name, {
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
