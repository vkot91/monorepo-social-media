"use client";

import type { ConversationDto } from "@social/contracts";

import { ConversationItem } from "./conversation-item";

type ConversationListProps = {
  activeId: string | null;
  conversations: ConversationDto[];
  onlineUserIds: Set<string>;
};

export const ConversationList = ({ activeId, conversations, onlineUserIds }: ConversationListProps) => {
  if (conversations.length === 0) {
    return <p className="px-3 py-6 text-sm text-muted-text">No conversations yet</p>;
  }

  return (
    <ul aria-label="Conversations" className="flex flex-col gap-1">
      {conversations.map((conversation) => (
        <li className="min-w-0" key={conversation.id}>
          <ConversationItem
            conversation={conversation}
            isActive={conversation.id === activeId}
            isOnline={onlineUserIds.has(conversation.participant.id)}
          />
        </li>
      ))}
    </ul>
  );
};
