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
