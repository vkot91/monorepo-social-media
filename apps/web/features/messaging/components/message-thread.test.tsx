import type { MessageDto, PaginatedMessagesDto } from "@social/contracts";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authKeys } from "#/features/auth/api/routes";
import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { getRealtimeSocket } from "#/shared/lib/realtime/socket";
import { createTestQueryClient } from "#/test/query-client";

import { MessageThread } from "./message-thread";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({ bffClient: vi.fn() }));
vi.mock("#/shared/lib/realtime/socket", () => ({ getRealtimeSocket: vi.fn() }));

type Handler = (payload: unknown) => void;

const createFakeSocket = () => {
  const handlers = new Map<string, Handler>();

  return {
    handlers,
    off: vi.fn((event: string) => handlers.delete(event)),
    on: vi.fn((event: string, cb: Handler) => handlers.set(event, cb)),
  };
};

const buildMessage = (overrides: Partial<MessageDto> = {}): MessageDto => ({
  content: "Hello",
  conversationId: "conv-1",
  createdAt: "2026-06-04T10:00:00.000Z",
  deletedAt: null,
  id: "msg-1",
  senderId: "user-1",
  ...overrides,
});

const page = (items: MessageDto[]): PaginatedMessagesDto => ({
  items,
  pageInfo: { hasNextPage: false, limit: 20, mode: "cursor", nextCursor: null },
});

const renderThread = (ui: ReactElement) => {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(authKeys.me(), { id: "user-1" });

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe("MessageThread", () => {
  let socket: ReturnType<typeof createFakeSocket>;

  beforeEach(() => {
    vi.clearAllMocks();
    socket = createFakeSocket();
    vi.mocked(getRealtimeSocket).mockReturnValue(socket as never);
  });

  it("renders messages from both participants", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(
      page([buildMessage({ id: "msg-2", content: "Hi back", senderId: "user-2" }), buildMessage({ id: "msg-1", content: "Hello" })]),
    );

    renderThread(<MessageThread conversationId="conv-1" initialCounterpartReadAt={null} />);

    expect(await screen.findByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi back")).toBeInTheDocument();
  });

  it("shows an empty state when there are no messages", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(page([]));

    renderThread(<MessageThread conversationId="conv-1" initialCounterpartReadAt={null} />);

    expect(await screen.findByText(/say hello/i)).toBeInTheDocument();
  });

  it("deletes an own message via its actions menu", async () => {
    vi.mocked(bffClient)
      .mockResolvedValueOnce(page([buildMessage({ id: "msg-1", content: "Hello", senderId: "user-1" })]))
      .mockResolvedValueOnce(buildMessage({ id: "msg-1", content: "", deletedAt: "2026-06-04T11:00:00.000Z" }));

    renderThread(<MessageThread conversationId="conv-1" initialCounterpartReadAt={null} />);

    await screen.findByText("Hello");
    fireEvent.click(screen.getByRole("button", { name: /open message actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /delete/i }));

    await waitFor(() =>
      expect(bffClient).toHaveBeenCalledWith("/api/messaging/messages/{id}", "DELETE", { params: { id: "msg-1" } }),
    );
    expect(await screen.findByText("Message deleted")).toBeInTheDocument();
  });

  it("marks the latest own message as seen on a read receipt", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(page([buildMessage({ id: "msg-1", content: "Hello", senderId: "user-1" })]));

    renderThread(<MessageThread conversationId="conv-1" initialCounterpartReadAt={null} />);
    await screen.findByText("Hello");

    act(() =>
      socket.handlers.get("message:read")?.({
        conversationId: "conv-1",
        readAt: "2026-06-04T12:00:00.000Z",
        userId: "user-2",
      }),
    );

    expect(await screen.findByLabelText("Seen")).toBeInTheDocument();
  });

  it("marks every own message read up to the counterpart's read time", async () => {
    vi.mocked(bffClient).mockResolvedValueOnce(
      page([
        buildMessage({ id: "msg-2", content: "Newer", createdAt: "2026-06-04T10:05:00.000Z", senderId: "user-1" }),
        buildMessage({ id: "msg-1", content: "Older", createdAt: "2026-06-04T10:00:00.000Z", senderId: "user-1" }),
      ]),
    );

    renderThread(<MessageThread conversationId="conv-1" initialCounterpartReadAt="2026-06-04T12:00:00.000Z" />);

    await screen.findByText("Older");
    expect(screen.getAllByLabelText("Seen")).toHaveLength(2);
    expect(screen.queryByLabelText("Delivered")).not.toBeInTheDocument();
  });
});
