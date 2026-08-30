import type { BadgeProps } from "@/components/ui/badge";
import type { TicketStatus } from "@/types/ticket-list";

/**
 * Badge variant per ticket status, shared between the ticket list and detail
 * pages so the status colours stay visually consistent across both.
 */
export const STATUS_BADGE_VARIANT: Record<TicketStatus, BadgeProps["variant"]> = {
  Unclaimed: "outline",
  Claimed: "secondary",
  Ongoing: "info",
  Completed: "default",
  Canceled: "destructive",
};

/**
 * A ticket's conversation is "active" — an agent is currently working it — when
 * its Status is Claimed or Ongoing. This is the exact condition that gates the
 * Conversations Inbox Visibility Rule and the ticket detail page's "View
 * Conversation" link, so both derive it from here rather than re-encoding it.
 */
export function isActiveStatus(status: TicketStatus): boolean {
  return status === "Claimed" || status === "Ongoing";
}

/**
 * A ticket is terminal — no further lifecycle action applies and its composer
 * is locked — when its Status is Completed or Canceled. Shared so the list,
 * detail page, and conversation pane classify terminal state identically.
 */
export function isTerminalStatus(status: TicketStatus): boolean {
  return status === "Completed" || status === "Canceled";
}
