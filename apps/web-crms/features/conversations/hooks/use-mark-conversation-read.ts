import { useEffect, useRef } from "react";
import { conversationTicketsApi } from "@/features/conversations/services/conversations-api";
import { isTerminalStatus } from "@/features/conversations/services/tickets";
import type { TicketListItem } from "@/features/conversations/types";

export function useMarkConversationRead(
  selectedTicketId: string | undefined,
  selectedFromList: TicketListItem | null,
  mergeTicket: (ticket: TicketListItem) => void
) {
  const markedReadRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedTicketId) return;
    const row = selectedFromList;
    if (!row) return;
    if (markedReadRef.current === selectedTicketId) return;
    if (isTerminalStatus(row.status)) return;
    if (row.waitingOn !== "Agent") return;

    markedReadRef.current = selectedTicketId;
    void (async () => {
      try {
        const updated = await conversationTicketsApi.setWaitingOn(
          selectedTicketId,
          { waitingOn: "None" }
        );
        mergeTicket({
          id: updated.id,
          subject: updated.subject,
          status: updated.status,
          waitingOn: updated.waitingOn,
          source: updated.source,
          assignedToId: updated.assignedToId,
          assignedToName: updated.assignedToName,
          assignedToEmail: updated.assignedToEmail,
          contactId: updated.contactId,
          contact: updated.contact,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        });
      } catch {
        // Best-effort: if the mark-read call fails, allow a later view to retry.
        markedReadRef.current = null;
      }
    })();
  }, [selectedTicketId, selectedFromList, mergeTicket]);
}
