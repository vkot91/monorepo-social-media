import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
  RequestTimeoutException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { type Observable, throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

import { REQUEST_TIMEOUT_KEY } from "#common/decorators/request-timeout.decorator";

export const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const configuredTimeout =
      this.reflector.get<number>(REQUEST_TIMEOUT_KEY, context.getHandler()) ?? DEFAULT_REQUEST_TIMEOUT_MS;

    return next.handle().pipe(
      timeout(configuredTimeout),
      catchError((error: unknown) =>
        error instanceof TimeoutError ? throwError(() => new RequestTimeoutException()) : throwError(() => error),
      ),
    );
  }
}
