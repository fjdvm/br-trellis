"use client";

import { useEffect, useState } from "react";
import { conversationTicketsApi } from "../services/conversations-api";
import { MessageThread } from "./message-thread";
import type { ConversationAction } from "./conversation-actions-menu";
import { isTerminalStatus, TicketListItem } from "@/features/tickets";

export interface ConversationPaneProps {
  ticketId: string;
  /**
   * The ticket row from the loaded list, when the open conversation is one of
   * my worklist conversations. `null` when deep-linked to a ticket outside my
   * worklist — the pane then fetches it by id so contact/terminal are correct.
   */
  ticket: TicketListItem | null;
  /**
   * Whether the worklist list has finished loading. The pane waits for this
   * before deciding to fetch by id, so a worklist conversation opened via
   * navigation uses its already-loaded row instead of triggering a redundant
   * `getById` during the list's initial load window.
   */
  listLoaded: boolean;
}

/**
 * Wraps the reused `MessageThread` with the same reply-side behavior the ticket
 * detail page has always had: on a successful send, flip the ticket's WaitingOn
 * to Customer. When the open conversation isn't in my loaded list (a deep-linked
 * colleague's ticket), fetch it by id so the composer's terminal lockout and the
 * contact header are accurate.
 */
export function ConversationPane({ ticketId, ticket, listLoaded }: ConversationPaneProps) {
  const [resolved, setResolved] = useState<TicketListItem | null>(ticket);
  // True while a lifecycle mutation (status change / unclaim) is in flight, so
  // the header's 3-dot menu disables itself until the call settles.
  const [actionBusy, setActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      // The open conversation is one of my worklist rows — use it directly.
      setResolved(ticket);
      return;
    }
    // Not in my worklist. Wait until the list is known before deep-fetching, so
    // a worklist row still loading in doesn't trigger a redundant getById.
    if (!listLoaded) return;
    let cancelled = false;
    void (async () => {
      try {
        const detail = await conversationTicketsApi.getById(ticketId);
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
        // Leave `resolved` null; MessageThread still renders its own thread and
        // surfaces any message-fetch error itself.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ticketId, ticket, listLoaded]);

  const isTerminal = resolved ? isTerminalStatus(resolved.status) : false;

  function handleMessageSent() {
    void conversationTicketsApi.setWaitingOn(ticketId, {
      waitingOn: "Customer",
    });
  }

  /**
   * Run a lifecycle mutation from the header's 3-dot menu. Each action maps to
   * the same conversationTickets endpoints the ticket detail page uses:
   * `ongoing`/`complete`/`cancel` change Status; `unclaim` releases ownership.
   * The returned `TicketDetail` is projected back into the pane's `resolved`
   * row so the header, composer lockout, and status all update in place — no
   * refetch needed. The Conversations Inbox list re-syncs via its SignalR
   * `onTicketStatusChanged` / focus refetch, so a now-terminal or unclaimed
   * conversation drops out of the worklist on its own.
   */
  function handleAction(action: ConversationAction) {
    setActionBusy(true);
    setActionError(null);
    void (async () => {
      try {
        const updated =
          action === "unclaim"
            ? await conversationTicketsApi.unclaim(ticketId)
            : await conversationTicketsApi.changeStatus(ticketId, {
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
