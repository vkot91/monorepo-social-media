import type { HttpRequestWithMetadata } from "#common/types/http-request";

import { RequestTimingMiddleware } from "./request-timing.middleware";

describe("RequestTimingMiddleware", () => {
  it("stores the request start timestamp before continuing", () => {
    const middleware = new RequestTimingMiddleware();
    const request = { url: "/test" } as HttpRequestWithMetadata;
    const next = jest.fn();

    middleware.use(request, {} as never, next);

    expect(request.requestStartedAt).toEqual(expect.any(Number));
    expect(next).toHaveBeenCalledTimes(1);
  });
});
