import { io } from "socket.io-client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

import { disconnectRealtimeSocket, getRealtimeSocket } from "./socket";

vi.mock("socket.io-client", () => ({
  io: vi.fn(),
}));

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({
  bffClient: vi.fn(),
}));

vi.mock("#/env", () => ({
  getWebEnv: () => ({ NEXT_PUBLIC_API_URL: "http://api.test" }),
}));

const fakeSocket = { disconnect: vi.fn() };

describe("messaging socket", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(io).mockReturnValue(fakeSocket as never);
  });

  afterEach(() => {
    disconnectRealtimeSocket();
  });

  it("creates a single socket instance configured for the API origin", () => {
    const first = getRealtimeSocket();
    const second = getRealtimeSocket();

    expect(first).toBe(second);
    expect(io).toHaveBeenCalledTimes(1);
    expect(io).toHaveBeenCalledWith(
      "http://api.test",
      expect.objectContaining({ autoConnect: false, transports: ["websocket"] }),
    );
  });

  it("resolves the auth token from the BFF before each handshake", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce({ token: "jwt-123" });
    getRealtimeSocket();

    const config = vi.mocked(io).mock.calls[0]?.[1] as { auth: (cb: (data: { token: string }) => void) => void };
    const callback = vi.fn();

    await new Promise<void>((resolve) => {
      config.auth((data) => {
        callback(data);
        resolve();
      });
    });

    expect(bffClient).toHaveBeenCalledWith("/api/realtime/token", "GET", {});
    expect(callback).toHaveBeenCalledWith({ token: "jwt-123" });
  });

  it("disconnects and clears the singleton", () => {
    getRealtimeSocket();

    disconnectRealtimeSocket();

    expect(fakeSocket.disconnect).toHaveBeenCalled();

    getRealtimeSocket();
    expect(io).toHaveBeenCalledTimes(2);
  });
});
