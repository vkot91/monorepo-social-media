import type { ConversationDto } from "@social/contracts";
import { QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";
import { getRealtimeSocket } from "#/shared/lib/realtime/socket";
import { createTestQueryClient } from "#/test/query-client";

import { MessagesShell } from "./messages-shell";

vi.mock("#/shared/lib/api/api-client/bff-client", () => ({ bffClient: vi.fn() }));
vi.mock("#/shared/lib/realtime/socket", () => ({ getRealtimeSocket: vi.fn() }));

const useParamsMock = vi.fn();
vi.mock("next/navigation", () => ({ useParams: () => useParamsMock() }));

const conversation: ConversationDto = {
  counterpartReadAt: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  id: "conv-1",
  lastMessage: null,
  lastMessageAt: null,
  participant: { avatarUrl: null, displayName: "Ada Lovelace", id: "user-2", username: "ada" },
  unreadCount: 0,
};

const renderShell = (children: ReactNode) => {
  const queryClient = createTestQueryClient();

  return render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
};

describe("MessagesShell", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useParamsMock.mockReturnValue({});
    vi.mocked(getRealtimeSocket).mockReturnValue({ off: vi.fn(), on: vi.fn() } as never);
    vi.mocked(bffClient).mockResolvedValue([conversation] as never);
  });

  it("renders the conversation list alongside the active pane", async () => {
    renderShell(<MessagesShell>thread pane</MessagesShell>);

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("thread pane")).toBeInTheDocument();
  });

  it("highlights the conversation matched by the route param", async () => {
    useParamsMock.mockReturnValue({ id: "conv-1" });

    renderShell(<MessagesShell>thread pane</MessagesShell>);

    expect(await screen.findByRole("link", { name: /ada lovelace/i })).toHaveAttribute("aria-current", "page");
  });
});
