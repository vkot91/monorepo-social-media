import { type INestApplication } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { prisma } from "@social/database";

import { HttpExceptionFilter } from "#common/filters/http-exception.filter";
import { RequestLoggingInterceptor } from "#common/interceptors/request-logging.interceptor";
import { TimeoutInterceptor } from "#common/interceptors/timeout.interceptor";
import { LoggingService } from "#common/logging/logging.service";

import { AppModule } from "../../src/app.module";

export async function createTestApp(): Promise<INestApplication> {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication();
  const loggingService = app.get(LoggingService);

  app.useGlobalFilters(new HttpExceptionFilter(loggingService));
  app.useGlobalInterceptors(new RequestLoggingInterceptor(loggingService), new TimeoutInterceptor(app.get(Reflector)));
  app.enableCors({ credentials: true, origin: process.env.CORS_ORIGIN });

  await app.listen(0, "127.0.0.1");
  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
  await prisma.$disconnect();
}
