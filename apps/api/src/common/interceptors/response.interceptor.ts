import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  mixin,
  NestInterceptor,
  Type,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import z, { ZodTypeAny } from "zod";

import { LoggingService } from "#common/logging/logging.service";

export const ZodResponseInterceptor = <T extends ZodTypeAny>(schema: T): Type<NestInterceptor<unknown, z.infer<T>>> => {
  @Injectable()
  class ZodResponseSchemaInterceptor implements NestInterceptor<unknown, T> {
    constructor(private readonly loggingService: LoggingService) {}

    intercept(_context: ExecutionContext, next: CallHandler<unknown>): Observable<T> {
      return next.handle().pipe(
        map((data: unknown) => {
          const result = schema.safeParse(data);

          if (!result.success) {
            this.loggingService.error(ZodResponseSchemaInterceptor.name, {
              errors: result.error.flatten(),
              message: "Response validation failed",
            });

            throw new InternalServerErrorException({
              message: "Invalid response shape",
              errors: result.error.flatten(),
            });
          }

          return result.data;
        }),
      );
    }
  }

  return mixin(ZodResponseSchemaInterceptor);
};
