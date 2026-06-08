import type { MessageDto } from "@social/contracts";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MessageBubble } from "./message-bubble";

const buildMessage = (overrides: Partial<MessageDto> = {}): MessageDto => ({
  content: "Hey there",
  conversationId: "conv-1",
  createdAt: "2026-06-04T10:00:00.000Z",
  deletedAt: null,
  id: "msg-1",
  senderId: "user-1",
  ...overrides,
});

describe("MessageBubble", () => {
  it("renders message content", () => {
    render(<MessageBubble isOwn={false} isSeen={false} message={buildMessage()} onDelete={vi.fn()} />);

    expect(screen.getByText("Hey there")).toBeInTheDocument();
  });

  it("renders a tombstone and no actions for deleted messages", () => {
    render(
      <MessageBubble
        isOwn
        isSeen={false}
        message={buildMessage({ content: "", deletedAt: "2026-06-04T11:00:00.000Z" })}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Message deleted")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /open message actions/i })).not.toBeInTheDocument();
  });

  it("shows a seen check for own seen messages", () => {
    render(<MessageBubble isOwn isSeen message={buildMessage()} onDelete={vi.fn()} />);

    expect(screen.getByLabelText("Seen")).toBeInTheDocument();
    expect(screen.queryByLabelText("Delivered")).not.toBeInTheDocument();
  });

  it("shows a delivered check for own unseen messages", () => {
    render(<MessageBubble isOwn isSeen={false} message={buildMessage()} onDelete={vi.fn()} />);

    expect(screen.getByLabelText("Delivered")).toBeInTheDocument();
    expect(screen.queryByLabelText("Seen")).not.toBeInTheDocument();
  });

  it("does not show a delivery status for the counterpart's messages", () => {
    render(<MessageBubble isOwn={false} isSeen message={buildMessage({ senderId: "user-2" })} onDelete={vi.fn()} />);

    expect(screen.queryByLabelText("Seen")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Delivered")).not.toBeInTheDocument();
  });

  it("deletes an own message through the actions menu", () => {
    const onDelete = vi.fn();
    render(<MessageBubble isOwn isSeen={false} message={buildMessage()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: /open message actions/i }));
    fireEvent.click(screen.getByRole("menuitem", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledWith("msg-1");
  });
});
