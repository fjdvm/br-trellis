import type { ChatMessage } from "@/types/chat";

/**
 * The api-oos `GET /support/tickets/{id}` response shape, as fetched server-side by
 * the Conversation Server Component. Only produced for the owner-verified caller —
 * NotFound/NotOwner both come back as an HTTP 404 (never a distinguishable body), so
 * the fetch layer collapses them into a single `not-found` result before this ever
 * runs (ADR 0005).
 */
export interface ConversationDetail {
  id: string;
  subject: string;
  status: string;
  /** "awaiting-staff-reply" (waiting state, no messages) or "open" (full thread). */
  state: "awaiting-staff-reply" | "open";
  messages: ConversationDetailMessage[];
}

export interface ConversationDetailMessage {
  id: string;
  /** "Contact" or "Staff", as api-crms/api-oos serialise MessageSenderType. */
  senderType: string;
  senderStaffName?: string | null;
  content: string;
  sentAt: string;
}

/**
 * The already-authenticated, already-ownership-verified outcome the fetch layer hands
 * to {@link resolveConversationAccess}. A 404 (ticket missing OR not the caller's)
 * becomes `not-found`; a 200 becomes `ok` with the conversation.
 */
export type ConversationFetchResult =
  | { status: "ok"; conversation: ConversationDetail }
  | { status: "not-found" };

/**
 * The render decision for the Conversation page. This is a pure translation of an
 * already-trusted fetch result into what the page should show — it bears no security
 * weight itself (ownership was already decided server-side by api-oos).
 *
 * `render-conversation` — show the full thread (Staff has replied).
 * `render-waiting` — owner-verified, but Staff hasn't replied yet: show the waiting
 *   state (subject/status only, no thread, no input).
 * `not-found` — call Next's notFound().
 */
export type ConversationAccess =
  | { kind: "render-conversation"; conversation: ConversationDetail }
  | { kind: "render-waiting"; conversation: ConversationDetail }
  | { kind: "not-found" };

/**
 * Pure, side-effect-free: given the fetch result, decide what the page renders.
 * Sign-in redirection is handled upstream by middleware (the whole /support subtree
 * requires auth), so this only resolves the authenticated outcomes. The waiting vs
 * open split mirrors the server's staff-reply gate (#145) — this function does not
 * re-derive it from message contents, it trusts the server's `state`.
 */
export function resolveConversationAccess(result: ConversationFetchResult): ConversationAccess {
  if (result.status === "not-found") {
    return { kind: "not-found" };
  }
  if (result.conversation.state === "awaiting-staff-reply") {
    return { kind: "render-waiting", conversation: result.conversation };
  }
  return { kind: "render-conversation", conversation: result.conversation };
}

/**
 * Adapts the server-verified message history into the client `ChatMessage` shape the
 * existing ConversationPage/ChatMessageBubble render. Staff messages become "agent",
 * Contact messages become "user" — matching the sender-type vocabulary the chat UI
 * already uses.
 */
export function toChatMessages(conversation: ConversationDetail): ChatMessage[] {
  return conversation.messages.map((m) => {
    const isStaff = m.senderType?.toLowerCase() === "staff";
    return {
      id: m.id,
      senderId: isStaff ? "agent" : "user",
      senderName: isStaff ? m.senderStaffName ?? "Support Agent" : undefined,
      senderType: isStaff ? "agent" : "user",
      content: m.content,
      isRead: true,
      sentAt: m.sentAt,
    };
  });
}
