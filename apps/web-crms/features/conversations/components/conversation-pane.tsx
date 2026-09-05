"use client";

import { useEffect, useState } from "react";
import { crmClient } from "@/lib/api/crm-client";
import { MessageThread } from "@/features/conversations/components/message-thread";
import type { ConversationAction } from "@/features/conversations/components/conversation-actions-menu";
import { isTerminalStatus } from "@/lib/tickets";
import type { TicketListItem } from "@/types/ticket-list";

interface ConversationPaneProps {
  ticketId: string;
  ticket: TicketListItem | null;
  listLoaded: boolean;
}

export function ConversationPane({ ticketId, ticket, listLoaded }: ConversationPaneProps) {
  const [resolved, setResolved] = useState<TicketListItem | null>(ticket);
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      setResolved(ticket);
      return;
    }
    if (!listLoaded) return;
    let cancelled = false;
    void (async () => {
      try {
        const detail = await crmClient.conversationTickets.getById(ticketId);
        if (!cancelled) {
          setResolved({
            id: detail.id,
            subject: detail.subject,
            status: detail.status,
            waitingOn: detail.waitingOn,
            source: detail.source,
            assignedToId: detail.assignedToId,
            assignedToName: detail.assignedToName,
            assignedToEmail: detail.assignedToEmail,
            contactId: detail.contactId,
            contact: detail.contact,
            createdAt: detail.createdAt,
            updatedAt: detail.updatedAt,
          });
        }
      } catch {
        // Leave `resolved` null
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId, ticket, listLoaded]);

  const isTerminal = resolved ? isTerminalStatus(resolved.status) : false;

  function handleMessageSent() {
    void crmClient.conversationTickets.setWaitingOn(ticketId, {
      waitingOn: "Customer",
    });
  }

  function handleAction(action: ConversationAction) {
    setActionBusy(true);
    setActionError(null);
    void (async () => {
      try {
        const updated =
          action === "unclaim"
            ? await crmClient.conversationTickets.unclaim(ticketId)
            : await crmClient.conversationTickets.changeStatus(ticketId, {
                status:
                  action === "ongoing"
                    ? "Ongoing"
                    : action === "complete"
                    ? "Completed"
                    : "Canceled",
              });
        setResolved({
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
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Action failed. Please try again."
        );
      } finally {
        setActionBusy(false);
      }
    })();
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {actionError && (
        <p
          className="px-md pt-md text-base text-destructive shrink-0"
          role="alert"
        >
          {actionError}
        </p>
      )}
      <MessageThread
        ticketId={ticketId}
        contactName={resolved?.contact?.name ?? null}
        contactEmail={resolved?.contact?.email ?? null}
        ticketSubject={resolved?.subject ?? null}
        isTerminal={isTerminal}
        onMessageSent={handleMessageSent}
        status={resolved?.status}
        onAction={resolved ? handleAction : undefined}
        actionBusy={actionBusy}
      />
    </div>
  );
}
