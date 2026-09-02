import type { TicketSummary } from "@/types/chat";
import type { ConversationDetail } from "@/lib/support/conversation-access";

/**
 * Strips the "[Type] " prefix shopper tickets are filed with (see api-oos
 * SupportTicketService) so the customer sees the title they typed. Subjects without a
 * prefix are returned untouched.
 */
export function stripTypePrefix(subject: string): string {
  const trimmed = subject.trim();
  if (trimmed.startsWith("[")) {
    const close = trimmed.indexOf("]");
    if (close > 0 && close < trimmed.length - 1) {
      return trimmed.slice(close + 1).trim();
    }
  }
  return trimmed || "Support Ticket";
}

/**
 * Adapts the server-verified {@link ConversationDetail} into the {@link TicketSummary}
 * shape the Conversation view consumes. The view only needs id/title/status; the
 * remaining TicketSummary fields aren't surfaced here.
 */
export function toTicketSummary(conversation: ConversationDetail): TicketSummary {
  return {
    id: conversation.id,
    title: stripTypePrefix(conversation.subject),
    description: "",
    status: conversation.status,
    customerId: "",
    createdAt: "",
    updatedAt: "",
  };
}
