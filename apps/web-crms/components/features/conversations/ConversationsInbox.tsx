"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox as InboxIcon, MessageSquare } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crmClient } from "@/lib/api/crm-client";
import { useCurrentAgentId } from "@/hooks/useCurrentAgentId";
import { MessageThread } from "@/components/features/conversations/MessageThread";
import { STATUS_BADGE_VARIANT, isActiveStatus, isTerminalStatus } from "@/lib/tickets";
import { formatName, formatEmail } from "@/lib/format-display";
import type { TicketListItem } from "@/types/ticket-list";

interface ConversationsInboxProps {
  /**
   * The ticket whose conversation is open in the right-hand pane, taken from
   * the URL (`/conversations/[id]`). When absent, the pane shows a "select a
   * conversation" placeholder. A ticket id here need not satisfy the
   * Visibility Rule — deep-linking into a colleague's conversation is allowed
   * (visibility governs the list, not access), so the pane opens whatever id
   * the URL carries.
   */
  selectedTicketId?: string;
}

/** The thread-list label for a conversation: contact name → email → em dash. */
function conversationLabel(ticket: TicketListItem): string {
  return (
    formatName(ticket.contact?.name) ??
    formatEmail(ticket.contact?.email) ??
    "\u2014"
  );
}

/**
 * The messenger-style Conversations Inbox: a thread list on the left, an open
 * conversation pane on the right. The list is the signed-in agent's personal
 * worklist under the Visibility Rule — a conversation appears iff its ticket's
 * `assignedToId` is the agent (resolved via the shared `useCurrentAgentId`
 * hook, exactly as My Assigned and Claim resolve identity) AND its Status is
 * Claimed or Ongoing. Unclaimed tickets, tickets owned by someone else, and
 * terminal (Completed/Canceled) tickets never appear.
 *
 * The list loads once on mount (no background poll, matching the Tickets/My
 * Assigned lists); only the opened conversation pane polls, inside the reused
 * `MessageThread`. Selecting a conversation pushes `/conversations/[id]` so a
 * refresh or direct link lands on the right open thread.
 */
export function ConversationsInbox({ selectedTicketId }: ConversationsInboxProps) {
  const router = useRouter();
  const currentAgentId = useCurrentAgentId();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      // The existing ticket-list endpoint, unchanged — the Visibility Rule is a
      // client-side filter over the full list, no new query params.
      const result = await crmClient.conversationTickets.list();
      setTickets(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load conversations."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  /**
   * The Visibility Rule: my active conversations, most-recently-updated first.
   * `currentAgentId === null` (no session) matches nothing, so an
   * unauthenticated view shows an empty worklist rather than everyone's tickets.
   */
  const conversations = useMemo(() => {
    return tickets
      .filter(
        (t) =>
          t.assignedToId !== null &&
          t.assignedToId === currentAgentId &&
          isActiveStatus(t.status)
      )
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [tickets, currentAgentId]);

  /**
   * The open conversation's ticket. Prefer the row already in the loaded list
   * (so the pane has its contact + status without a second fetch); fall back to
   * fetching by id when the URL points at a conversation outside my worklist
   * (a deep-linked colleague's ticket).
   */
  const selectedFromList = selectedTicketId
    ? tickets.find((t) => t.id === selectedTicketId) ?? null
    : null;

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Inbox
        </h1>
        <p className="text-body-md text-muted-foreground">
          Your active conversations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg items-start">
        {/* Left column: the thread list. */}
        <Card className="shadow-none border-border lg:col-span-1 min-w-0">
          <CardHeader className="pb-md p-lg">
            <CardTitle className="text-title-lg font-bold flex items-center gap-2">
              <InboxIcon className="w-5 h-5" />
              Conversations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-lg pt-0">
            {isLoading ? (
              <TableSkeleton columns={1} />
            ) : error ? (
              <div className="p-xl text-destructive">{error}</div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-xl">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-md" />
                <p className="text-base text-muted-foreground">
                  Nothing to work on right now.
                </p>
              </div>
            ) : (
              <ul
                className="max-h-[640px] overflow-y-auto space-y-xs"
                aria-label="Conversations"
              >
                {conversations.map((ticket) => {
                  const isSelected = ticket.id === selectedTicketId;
                  return (
                    <li key={ticket.id}>
                      <button
                        type="button"
                        aria-current={isSelected ? "true" : undefined}
                        onClick={() =>
                          router.push(`/conversations/${ticket.id}`)
                        }
                        className={`w-full text-left rounded-lg border p-md transition-colors ${
                          isSelected
                            ? "border-primary bg-muted"
                            : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-base font-medium truncate">
                            {conversationLabel(ticket)}
                          </span>
                          <Badge variant={STATUS_BADGE_VARIANT[ticket.status]}>
                            {ticket.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-xs">
                          {ticket.subject}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Right column: the open conversation pane. */}
        <div className="lg:col-span-2 min-w-0" data-testid="conversation-pane">
          {selectedTicketId ? (
            <ConversationPane
              ticketId={selectedTicketId}
              ticket={selectedFromList}
              listLoaded={!isLoading && error === null}
            />
          ) : (
            <Card className="shadow-none border-border">
              <CardContent className="flex flex-col items-center justify-center text-center min-h-[320px] py-xl">
                <MessageSquare className="w-10 h-10 text-muted-foreground mb-md" />
                <p className="text-base text-muted-foreground">
                  Select a conversation to open it.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

interface ConversationPaneProps {
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
function ConversationPane({ ticketId, ticket, listLoaded }: ConversationPaneProps) {
  const [resolved, setResolved] = useState<TicketListItem | null>(ticket);

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
        const detail = await crmClient.conversationTickets.getById(ticketId);
        if (!cancelled) {
          setResolved({
            id: detail.id,
            subject: detail.subject,
            status: detail.status,
            waitingOn: detail.waitingOn,
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
    void crmClient.conversationTickets.setWaitingOn(ticketId, {
      waitingOn: "Customer",
    });
  }

  return (
    <MessageThread
      ticketId={ticketId}
      contactName={resolved?.contact?.name ?? null}
      contactEmail={resolved?.contact?.email ?? null}
      isTerminal={isTerminal}
      onMessageSent={handleMessageSent}
    />
  );
}
