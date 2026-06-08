import type { INestApplication } from "@nestjs/common";

import { closeTestApp, createTestApp } from "#e2e/support/create-app";
import { makeRequest, type RequestFn } from "#e2e/support/request";

let app: INestApplication;
let request: RequestFn;

beforeAll(async () => {
  app = await createTestApp();
  request = makeRequest(await app.getUrl());
});

afterAll(async () => {
  await closeTestApp(app);
});

describe("health", () => {
  it("returns health status", async () => {
    const { body, response } = await request<{ status: string }>("/health");

    expect(response.status).toBe(200);
    expect(body).toEqual({ name: "social-media-api", status: "ok" });
  });
});
