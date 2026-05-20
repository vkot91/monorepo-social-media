import { NestFactory, Reflector } from "@nestjs/core";

import { AppModule } from "./app.module";
import { LoggingService } from "./common/logging/logging.service";
import { bootstrap } from "./main";

jest.mock("@nestjs/core", () => ({
  NestFactory: {
    create: jest.fn(),
  },
  Reflector: class Reflector {},
}));

jest.mock("./config/env", () => ({
  env: jest.requireActual("#test/env").createTestApiEnv({
    PORT: 3001,
    CORS_ORIGIN: "http://localhost:3000",
  }),
}));

describe("bootstrap", () => {
  it("creates the Nest app, enables CORS, and listens on the configured port", async () => {
    const enableCors = jest.fn();
    const loggingService = {};
    const reflector = new Reflector();
    const get = jest.fn((token) => {
      if (token === LoggingService) {
        return loggingService;
      }

      return reflector;
    });
    const listen = jest.fn().mockResolvedValue(undefined);
    const useGlobalFilters = jest.fn();
    const useGlobalInterceptors = jest.fn();
    const app = { enableCors, get, listen, useGlobalFilters, useGlobalInterceptors };

    jest.mocked(NestFactory.create).mockResolvedValue(app as never);

    const result = await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule, {
      logger: false,
    });
    expect(useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(useGlobalInterceptors).toHaveBeenCalledTimes(1);
    expect(useGlobalInterceptors.mock.calls[0]).toHaveLength(2);
    expect(get).toHaveBeenCalledWith(LoggingService);
    expect(get).toHaveBeenCalledWith(Reflector);
    expect(enableCors).toHaveBeenCalledWith({
      credentials: true,
      origin: "http://localhost:3000",
    });
    expect(listen).toHaveBeenCalledWith(3001);
    expect(result).toBe(app);
  });
});
