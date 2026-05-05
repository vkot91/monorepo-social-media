import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { getApiEnv } from "./env";

export async function bootstrap() {
  const env = getApiEnv();
  const app = await NestFactory.create(AppModule);

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
