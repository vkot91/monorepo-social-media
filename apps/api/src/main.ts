import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { getApiEnv } from "./config/env";

export async function bootstrap() {
  const env = getApiEnv();
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());

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
