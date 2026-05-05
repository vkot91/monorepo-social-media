jest.mock("@social/database", () => ({
  prisma: {
    user: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

import { Test } from "@nestjs/testing";

import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

describe("HealthController", () => {
  it("returns the service payload", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [HealthService],
    }).compile();

    const controller = moduleRef.get(HealthController);

    await expect(controller.getHealth()).resolves.toEqual({
      name: "social-media-api",
      status: "ok",
      users: [],
    });
  });
});
