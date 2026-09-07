"use client";

import { useMemo } from "react";
import { isActiveStatus } from "@/features/tickets";
import type { TicketListItem } from "@/features/tickets";
import type { InboxFilter } from "../types/inbox-filter";

export function useInboxFilter(
  tickets: TicketListItem[],
  currentAgentId: string | null,
  filter: InboxFilter
) {
  return useMemo(() => {
    const matchesFilter = (t: TicketListItem) => {
      switch (filter) {
        case "Claimed":
          return t.status === "Claimed";
        case "Ongoing":
          return t.status === "Ongoing";
        case "Unread":
          return t.waitingOn === "Agent";
        case "Read":
          return t.waitingOn !== "Agent";
        case "All":
        default:
          return true;
      }
    };
    return tickets
      .filter(
        (t) =>
          t.assignedToId !== null &&
          t.assignedToId === currentAgentId &&
          isActiveStatus(t.status) &&
          matchesFilter(t)
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [tickets, currentAgentId, filter]);
}
