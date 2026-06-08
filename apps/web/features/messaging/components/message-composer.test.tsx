import type { MessageDto } from "@social/contracts";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authKeys } from "#/features/auth/api/routes";
import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { getRealtimeSocket } from "#/shared/lib/realtime/socket";
import { createTestQueryClient } from "#/test/query-client";

import { MessageComposer } from "./message-composer";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({ bffClient: vi.fn() }));
vi.mock("#/shared/lib/realtime/socket", () => ({ getRealtimeSocket: vi.fn() }));

const createFakeSocket = () => ({
  emit: vi.fn(),
  off: vi.fn(),
  on: vi.fn(),
});

const buildMessage = (overrides: Partial<MessageDto> = {}): MessageDto => ({
  content: "Hello",
  conversationId: "conv-1",
  createdAt: "2026-06-04T10:00:00.000Z",
  deletedAt: null,
  id: "msg-1",
  senderId: "user-1",
  ...overrides,
});

const renderComposer = (ui: ReactElement) => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.me(), { id: "user-1" });

  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
};

describe("MessageComposer", () => {
  let socket: ReturnType<typeof createFakeSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    socket = createFakeSocket();
    vi.mocked(getRealtimeSocket).mockReturnValue(socket as never);
  });

  it("emits a typing event while the user writes", () => {
    renderComposer(<MessageComposer conversationId="conv-1" />);

    fireEvent.change(screen.getByLabelText(/write a message/i), { target: { value: "Hi" } });

    expect(socket.emit).toHaveBeenCalledWith("typing", { conversationId: "conv-1", isTyping: true });
  });

  it("throttles the typing keepalive to one event per burst of keystrokes", () => {
    renderComposer(<MessageComposer conversationId="conv-1" />);

    const textarea = screen.getByLabelText(/write a message/i);
    fireEvent.change(textarea, { target: { value: "H" } });
    fireEvent.change(textarea, { target: { value: "He" } });
    fireEvent.change(textarea, { target: { value: "Hel" } });

    const typingTrueCalls = socket.emit.mock.calls.filter(
      ([event, payload]) => event === "typing" && (payload as { isTyping: boolean }).isTyping,
    );

    expect(typingTrueCalls).toHaveLength(1);
  });

  it("sends a message and stops typing", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(buildMessage());
    renderComposer(<MessageComposer conversationId="conv-1" />);

    fireEvent.change(screen.getByLabelText(/write a message/i), { target: { value: "Hello" } });
    fireEvent.click(screen.getByRole("button", { name: /send message/i }));

    await waitFor(() =>
      expect(bffClient).toHaveBeenCalledWith("/api/messaging/conversations/{id}/messages", "POST", {
        body: { content: "Hello" },
        params: { id: "conv-1" },
      }),
    );
    expect(socket.emit).toHaveBeenCalledWith("typing", { conversationId: "conv-1", isTyping: false });
  });

  it("submits on Enter without Shift", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(buildMessage());
    renderComposer(<MessageComposer conversationId="conv-1" />);

    const textarea = screen.getByLabelText(/write a message/i);
    fireEvent.change(textarea, { target: { value: "Quick" } });
    fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });

    await waitFor(() => expect(bffClient).toHaveBeenCalled());
  });
});
