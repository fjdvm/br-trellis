/**
 * Shop-chat conversation-key helpers (#150, ADR 0006).
 *
 * The shop-chat conversation key IS the CRM Ticket id — a single key used to join the
 * hub, relay messages, poll for staff replies, and re-enter from the profile. api-oos
 * mints it as a Guid and api-crms adopts it as the Ticket's own id. These helpers keep
 * the web-shop side honest about that: the per-user localStorage cache must only ever
 * hold a well-formed ticket id, so a stale or malformed entry can never strand a
 * returning customer on a key that no longer resolves.
 */

const GUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The per-user localStorage key holding the active shop-chat Ticket id. */
export function chatTicketStorageKey(userId: string): string {
  return `br_chat_ticket_${userId}`;
}

/**
 * True when a value is a usable shop-chat Ticket id: a well-formed Guid. A cached value
 * that fails this (empty, malformed, or a legacy non-Guid conversation key from before
 * ADR 0006) must be discarded rather than reused, so the widget starts a fresh
 * conversation instead of joining a group the CRM will never resolve.
 */
export function isUsableTicketId(value: string | null | undefined): value is string {
  return typeof value === "string" && GUID_RE.test(value.trim());
}
