import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";

import { LoggingService } from "#common/logging/logging.service";
import type { HttpRequestWithMetadata } from "#common/types/http-request";
import { getRequestDurationMs } from "#common/utils/request-duration";
import { getRequestId } from "#common/utils/request-id";

type ErrorResponse = {
  error: string;
  message: string | string[];
  path: string;
  statusCode: number;
  timestamp: string;
};

type HttpResponse = {
  status: (statusCode: number) => {
    json: (body: unknown) => unknown;
  };
};

function getExceptionResponse(exception: unknown) {
  if (!(exception instanceof HttpException)) {
    return {
      error: "Internal Server Error",
      message: "Internal server error",
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    };
  }

  const response = exception.getResponse();

  if (typeof response === "string") {
    return {
      error: exception.name,
      message: response,
      statusCode: exception.getStatus(),
    };
  }

  if (typeof response === "object" && response !== null) {
    const body = response as Partial<ErrorResponse>;

    return {
      error: body.error ?? exception.name,
      message: body.message ?? exception.message,
      statusCode: body.statusCode ?? exception.getStatus(),
    };
  }

  return {
    error: exception.name,
    message: exception.message,
    statusCode: exception.getStatus(),
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly loggingService: LoggingService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<HttpResponse>();
    const request = context.getRequest<HttpRequestWithMetadata>();
    const body = getExceptionResponse(exception);
    const requestId = getRequestId(request);

    this.loggingService.error(
      HttpExceptionFilter.name,
      {
        durationMs: getRequestDurationMs(request),
        errorName: exception instanceof Error ? exception.name : "UnknownError",
        method: request.method ?? "UNKNOWN",
        path: request.url,
        requestId,
        statusCode: body.statusCode,
      },
    );

    response.status(body.statusCode).json({
      ...body,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
