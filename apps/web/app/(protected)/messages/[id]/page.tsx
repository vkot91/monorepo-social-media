import { ActiveConversation } from "#/features/messaging/components/active-conversation";

export const metadata = {
  title: "Conversation",
  description: "View and participate in a conversation with another user.",
};

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return <ActiveConversation conversationId={id} />;
}
