import { HealthService } from "./health.service";

describe("HealthService", () => {
  it("returns the API status payload", async () => {
    const service = new HealthService();

    await expect(service.getStatus()).resolves.toEqual({
      name: "social-media-api",
      status: "ok",
    });
  });
});
