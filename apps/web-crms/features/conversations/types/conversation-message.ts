/**
 * Types for the Conversations ticket message *thread* (feature 4, backed by
 * #66). Mirrors `MessageDto`/`PostMessageDto` from
 * `apps/api-crms/DTOs/MessageDtos.cs` exactly.
 *
 * Deliberately separate from the legacy `types/message.ts` scaffold, which
 * targets a fictional API (a `senderId` query param, an `isRead`/`markRead`
 * endpoint that doesn't exist server-side). This follows the same precedent
 * `types/ticket-detail.ts` already set alongside the legacy `types/ticket.ts`.
 */

/** Which party authored a message (mirrors the backend `MessageSenderType` enum). */
export type MessageSenderType = "Contact" | "Staff";

/** A single message on a ticket's thread (mirrors `MessageDto`). */
export interface ConversationMessage {
  id: string;
  ticketId: string;
  senderType: MessageSenderType;
  senderContactId: string | null;
  senderStaffId: string | null;
  senderStaffName: string | null;
  content: string;
  sentAt: string;
}

/**
 * Body for POST /tickets/{id}/messages when a staff member replies.
 *
 * Intentionally narrower than the backend's general `PostMessageDto`: this UI
 * only ever sends Staff-authored messages, so the input shape offers no
 * `senderContactId` field and never lets the caller impersonate a Contact.
 * The client fixes `senderType: "Staff"` before sending.
 */
export interface PostStaffMessageInput {
  senderStaffId: string;
  senderStaffName: string;
  content: string;
}
