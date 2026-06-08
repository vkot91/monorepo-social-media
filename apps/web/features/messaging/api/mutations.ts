"use client";

import type { SendMessageInput, StartConversationInput } from "@social/contracts";

import { bffClient } from "#/shared/lib/api/api-client/bff-client";

export const startConversation = (input: StartConversationInput) =>
  bffClient("/api/messaging/conversations", "POST", { body: input });

export const sendMessage = ({
  conversationId,
  input,
}: {
  conversationId: string;
  input: SendMessageInput;
}) =>
  bffClient("/api/messaging/conversations/{id}/messages", "POST", {
    body: input,
    params: { id: conversationId },
  });

export const markConversationRead = (conversationId: string) =>
  bffClient("/api/messaging/conversations/{id}/read", "POST", { params: { id: conversationId } });

export const deleteMessage = (messageId: string) =>
  bffClient("/api/messaging/messages/{id}", "DELETE", { params: { id: messageId } });
