import type { ConversationDto } from "@social/contracts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConversationList } from "./conversation-list";

const buildConversation = (overrides: Partial<ConversationDto> = {}): ConversationDto => ({
  counterpartReadAt: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  id: "conv-1",
  lastMessage: null,
  lastMessageAt: null,
  participant: { avatarUrl: null, displayName: "Ada", id: "user-2", username: "ada" },
  unreadCount: 0,
  ...overrides,
});

describe("ConversationList", () => {
  it("renders an empty state when there are no conversations", () => {
    render(<ConversationList activeId={null} conversations={[]} onlineUserIds={new Set()} />);

    expect(screen.getByText("No conversations yet")).toBeInTheDocument();
  });

  it("renders one linked item per conversation", () => {
    const conversations = [
      buildConversation({ id: "conv-1", participant: { avatarUrl: null, displayName: "Ada", id: "user-2", username: "ada" } }),
      buildConversation({ id: "conv-2", participant: { avatarUrl: null, displayName: "Grace", id: "user-3", username: "grace" } }),
    ];

    render(<ConversationList activeId="conv-1" conversations={conversations} onlineUserIds={new Set(["user-3"])} />);

    expect(screen.getByRole("link", { name: /ada/i })).toHaveAttribute("href", "/messages/conv-1");
    expect(screen.getByRole("link", { name: /grace/i })).toHaveAttribute("href", "/messages/conv-2");
  });
});
