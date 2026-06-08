import { act, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useUser } from "#/features/auth/api/queries";
import { usePresenceStore } from "#/shared/lib/realtime/presence-store";
import { disconnectRealtimeSocket, getRealtimeSocket } from "#/shared/lib/realtime/socket";

import { RealtimeProvider } from "./realtime-provider";

vi.mock("#/features/auth/api/queries", () => ({ useUser: vi.fn() }));
vi.mock("#/shared/lib/realtime/socket", () => ({
  disconnectRealtimeSocket: vi.fn(),
  getRealtimeSocket: vi.fn(),
}));

type Handler = (payload: unknown) => void;

const createFakeSocket = () => {
  const handlers = new Map<string, Handler>();

  return {
    connect: vi.fn(),
    handlers,
    off: vi.fn((event: string) => handlers.delete(event)),
    on: vi.fn((event: string, cb: Handler) => handlers.set(event, cb)),
  };
};

describe("RealtimeProvider", () => {
  let socket: ReturnType<typeof createFakeSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    socket = createFakeSocket();
    vi.mocked(getRealtimeSocket).mockReturnValue(socket as never);
    usePresenceStore.setState({ onlineUserIds: new Set<string>() });
  });

  const mockViewer = (id: string | null) => {
    vi.mocked(useUser).mockReturnValue({ data: id ? { id } : undefined } as never);
  };

  it("connects the socket when a viewer is present", () => {
    mockViewer("user-1");

    render(
      <RealtimeProvider>
        <span>child</span>
      </RealtimeProvider>,
    );

    expect(socket.connect).toHaveBeenCalled();
  });

  it("does not connect when there is no viewer", () => {
    mockViewer(null);

    render(<RealtimeProvider>child</RealtimeProvider>);

    expect(socket.connect).not.toHaveBeenCalled();
  });

  it("renders its children", () => {
    mockViewer("user-1");

    const { getByText } = render(
      <RealtimeProvider>
        <span>child content</span>
      </RealtimeProvider>,
    );

    expect(getByText("child content")).toBeInTheDocument();
  });

  it("marks users online and offline from presence events", () => {
    mockViewer("user-1");

    render(<RealtimeProvider>child</RealtimeProvider>);

    act(() => socket.handlers.get("presence")?.({ online: true, userId: "user-2" }));
    expect(usePresenceStore.getState().onlineUserIds.has("user-2")).toBe(true);

    act(() => socket.handlers.get("presence")?.({ online: false, userId: "user-2" }));
    expect(usePresenceStore.getState().onlineUserIds.has("user-2")).toBe(false);
  });

  it("disconnects and clears presence on unmount", () => {
    mockViewer("user-1");

    const { unmount } = render(<RealtimeProvider>child</RealtimeProvider>);

    act(() => socket.handlers.get("presence")?.({ online: true, userId: "user-2" }));
    unmount();

    expect(socket.off).toHaveBeenCalledWith("presence", expect.any(Function));
    expect(disconnectRealtimeSocket).toHaveBeenCalled();
    expect(usePresenceStore.getState().onlineUserIds.size).toBe(0);
  });
});
