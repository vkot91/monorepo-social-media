import { NestFactory, Reflector } from "@nestjs/core";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { getApiEnv } from "./config/env";

export async function bootstrap() {
  const env = getApiEnv();
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new RequestLoggingInterceptor(), new TimeoutInterceptor(app.get(Reflector)));

  app.enableCors({
    credentials: true,
    origin: env.CORS_ORIGIN,
  });

  await app.listen(env.PORT);
  return app;
}

if (process.env.NODE_ENV !== "test") {
  void bootstrap();
}
