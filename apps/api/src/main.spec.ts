import { NestFactory, Reflector } from "@nestjs/core";

import { AppModule } from "./app.module";
import { bootstrap } from "./main";

jest.mock("@nestjs/core", () => ({
  NestFactory: {
    create: jest.fn(),
  },
  Reflector: class Reflector {},
}));

jest.mock("./config/env", () => ({
  getApiEnv: jest.fn(() => ({
    PORT: 3001,
    CORS_ORIGIN: "http://localhost:3000",
  })),
}));

describe("bootstrap", () => {
  it("creates the Nest app, enables CORS, and listens on the configured port", async () => {
    const enableCors = jest.fn();
    const get = jest.fn(() => new Reflector());
    const listen = jest.fn().mockResolvedValue(undefined);
    const useGlobalFilters = jest.fn();
    const useGlobalInterceptors = jest.fn();
    const app = { enableCors, get, listen, useGlobalFilters, useGlobalInterceptors };

    jest.mocked(NestFactory.create).mockResolvedValue(app as never);

    const result = await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(useGlobalFilters).toHaveBeenCalledTimes(1);
    expect(useGlobalInterceptors).toHaveBeenCalledTimes(1);
    expect(useGlobalInterceptors.mock.calls[0]).toHaveLength(2);
    expect(get).toHaveBeenCalledWith(Reflector);
    expect(enableCors).toHaveBeenCalledWith({
      credentials: true,
      origin: "http://localhost:3000",
    });
    expect(listen).toHaveBeenCalledWith(3001);
    expect(result).toBe(app);
  });
});
