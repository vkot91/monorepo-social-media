import { NestFactory, Reflector } from "@nestjs/core";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { LoggingService } from "./common/logging/logging.service";
import { env } from "./config/env";

export async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: env.NODE_ENV === "test" ? false : undefined,
  });
  const loggingService = app.get(LoggingService);

  app.useGlobalFilters(new HttpExceptionFilter(loggingService));
  app.useGlobalInterceptors(new RequestLoggingInterceptor(loggingService), new TimeoutInterceptor(app.get(Reflector)));

  app.enableCors({
    credentials: true,
    origin: env.CORS_ORIGIN,
  });

  await app.listen(env.PORT);
  return app;
}

if (require.main === module) {
  void bootstrap();
}
