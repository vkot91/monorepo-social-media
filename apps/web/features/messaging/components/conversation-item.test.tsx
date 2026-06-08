import type { ConversationDto } from "@social/contracts";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ConversationItem } from "./conversation-item";

const buildConversation = (overrides: Partial<ConversationDto> = {}): ConversationDto => ({
  counterpartReadAt: null,
  createdAt: "2026-06-01T10:00:00.000Z",
  id: "conv-1",
  lastMessage: {
    content: "See you soon",
    conversationId: "conv-1",
    createdAt: "2026-06-04T10:00:00.000Z",
    deletedAt: null,
    id: "msg-1",
    senderId: "user-2",
  },
  lastMessageAt: "2026-06-04T10:00:00.000Z",
  participant: { avatarUrl: null, displayName: "Ada Lovelace", id: "user-2", username: "ada" },
  unreadCount: 0,
  ...overrides,
});

describe("ConversationItem", () => {
  it("renders the participant name and last message preview", () => {
    render(<ConversationItem conversation={buildConversation()} isActive={false} isOnline={false} />);

    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("See you soon")).toBeInTheDocument();
  });

  it("links to the conversation route", () => {
    render(<ConversationItem conversation={buildConversation()} isActive={false} isOnline={false} />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/messages/conv-1");
  });

  it("shows a placeholder when there are no messages", () => {
    render(<ConversationItem conversation={buildConversation({ lastMessage: null })} isActive={false} isOnline={false} />);

    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("hides deleted last messages behind the placeholder", () => {
    render(
      <ConversationItem
        conversation={buildConversation({
          lastMessage: {
            content: "",
            conversationId: "conv-1",
            createdAt: "2026-06-04T10:00:00.000Z",
            deletedAt: "2026-06-04T11:00:00.000Z",
            id: "msg-1",
            senderId: "user-2",
          },
        })}
        isActive={false}
        isOnline={false}
      />,
    );

    expect(screen.getByText("No messages yet")).toBeInTheDocument();
  });

  it("renders an unread badge capped at 9+", () => {
    render(<ConversationItem conversation={buildConversation({ unreadCount: 12 })} isActive={false} isOnline />);

    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("marks the active conversation with aria-current", () => {
    render(<ConversationItem conversation={buildConversation()} isActive isOnline={false} />);

    expect(screen.getByRole("link")).toHaveAttribute("aria-current", "page");
  });
});
