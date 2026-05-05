import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { bootstrap } from "./main";

jest.mock("@nestjs/core", () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

jest.mock("./env", () => ({
  getApiEnv: jest.fn(() => ({
    PORT: 3001,
    CORS_ORIGIN: "http://localhost:3000",
  })),
}));

describe("bootstrap", () => {
  it("creates the Nest app, enables CORS, and listens on the configured port", async () => {
    const enableCors = jest.fn();
    const listen = jest.fn().mockResolvedValue(undefined);
    const app = { enableCors, listen };

    jest.mocked(NestFactory.create).mockResolvedValue(app as never);

    const result = await bootstrap();

    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
    expect(enableCors).toHaveBeenCalledWith({
      credentials: true,
      origin: "http://localhost:3000",
    });
    expect(listen).toHaveBeenCalledWith(3001);
    expect(result).toBe(app);
  });
});
