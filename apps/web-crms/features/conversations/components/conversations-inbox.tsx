"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Inbox as InboxIcon, MessagesSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { crmClient } from "@/lib/api/crm-client";
import { useCurrentAgentId } from "@/hooks/useCurrentAgentId";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useSignalR } from "@/hooks/useSignalR";
import { MessageThread } from "@/features/conversations/components/message-thread";
import type { ConversationAction } from "@/features/conversations/components/conversation-actions-menu";
import { STATUS_BADGE_VARIANT, isActiveStatus, isTerminalStatus } from "@/lib/tickets";
import { formatConversationTime } from "@/lib/format-conversation-time";
import { formatName, formatEmail } from "@/lib/format-display";
import type { TicketListItem } from "@/types/ticket-list";

/**
 * The Inbox's conversation filter. The worklist only ever contains active
 * (Claimed/Ongoing) conversations under the Visibility Rule — terminal
 * (Completed/Canceled) tickets are never shown here — so the filter narrows
 * *within* the active set along two dimensions:
 *  - status: `All` (the default) shows every active conversation; `Claimed`
 *    and `Ongoing` narrow to that single status.
 *  - read state: `Unread` keeps conversations awaiting the agent
 *    (`waitingOn === "Agent"` — the same signal behind the "Waiting on you"
 *    badge), `Read` keeps the rest (the agent has already replied, so the
 *    turn is the customer's or nobody's).
 */
type InboxFilter = "All" | "Claimed" | "Ongoing" | "Read" | "Unread";

/** Human labels for the filter dropdown, in display order. */
const INBOX_FILTER_LABELS: Record<InboxFilter, string> = {
  All: "All",
  Claimed: "Claimed",
  Ongoing: "Ongoing",
  Read: "Read",
  Unread: "Unread",
};

interface ConversationsInboxProps {
  /**
   * The ticket whose conversation is open in the right-hand pane, taken from
   * the URL (`/conversations/inbox/[id]`). When absent, the pane shows the
   * "No Conversation Selected" empty state. A ticket id here need not satisfy
   * the Visibility Rule — deep-linking into a colleague's conversation is
   * allowed (visibility governs the list, not access), so the pane opens
   * whatever id the URL carries.
   */
  selectedTicketId?: string;
}

/**
 * Parse the open conversation's ticket id out of the inbox pathname. The inbox
 * lives at `/conversations/inbox` (no selection) and `/conversations/inbox/[id]`
 * (a conversation open). Returns `undefined` when no conversation is selected.
 */
function selectedIdFromPathname(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const match = pathname.match(/\/conversations\/inbox\/([^/?#]+)/);
  return match?.[1];
}

/** The thread-list label for a conversation: contact name → email → em dash. */
function conversationLabel(ticket: TicketListItem): string {
  return (
    formatName(ticket.contact?.name) ??
    formatEmail(ticket.contact?.email) ??
    "\u2014"
  );
}

/** Up-to-two-letter initials for a conversation's avatar (e.g. "Jane Doe" → "JD"). */
function conversationInitials(ticket: TicketListItem): string {
  const label = conversationLabel(ticket);
  if (label === "\u2014") return "?";
  const parts = label.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

/**
 * The messenger-style Conversations Inbox: a split layout with a conversation
 * list on the left and the open conversation (or an empty state) on the right,
 * matching `.design-ref/templates/conversations_inbox_wireframe`.
 *
 * The list is the signed-in agent's personal worklist under the Visibility
 * Rule — a conversation appears iff its ticket's `assignedToId` is the agent
 * (resolved via the shared `useCurrentAgentId` hook, exactly as My Assigned and
 * Claim resolve identity) AND its Status is Claimed or Ongoing. Unclaimed
 * tickets, tickets owned by someone else, and terminal (Completed/Canceled)
 * tickets never appear. A header filter narrows within the active set; it
 * defaults to "All" so the inbox opens showing every Claimed/Ongoing
 * conversation and hiding all terminal ones. The other options narrow by
 * status ("Claimed"/"Ongoing") or read state ("Unread" = awaiting the agent,
 * "Read" = already replied to).
 *
 * The list loads once on mount (no background poll, matching the Tickets/My
 * Assigned lists); only the opened conversation pane polls, inside the reused
 * `MessageThread`. Selecting a conversation pushes `/conversations/inbox/[id]`
 * so a refresh or direct link lands on the right open thread.
 */
export function ConversationsInbox({
  selectedTicketId: selectedTicketIdProp,
}: ConversationsInboxProps) {
  const router = useRouter();
  const pathname = usePathname();
  // The open conversation id. Prefer an explicit prop (used in tests and any
  // server-passed value); otherwise derive it from the URL so selecting a
  // conversation — which only pushes `/conversations/inbox/[id]` — updates the
  // open pane WITHOUT remounting this component. Because a shared inbox layout
  // keeps `ConversationsInbox` mounted across those navigations, the left list
  // and the thread header/composer stay still; only the message pane re-reads
  // the new id and swaps its content.
  const selectedTicketId =
    selectedTicketIdProp ?? selectedIdFromPathname(pathname);
  const currentAgentId = useCurrentAgentId();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The conversation filter. Defaults to "All" so the worklist opens showing
  // every active (Claimed/Ongoing) conversation and hiding all terminal
  // (Completed/Canceled) ones; the other options narrow by status or read state.
  const [filter, setFilter] = useState<InboxFilter>("All");

  const loadConversations = useCallback(async (options?: { background?: boolean }) => {
    // Skip the full-page loading flip on a focus-triggered background refresh so
    // the worklist stays visible while it re-syncs.
    if (!options?.background) {
      setIsLoading(true);
    }
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
      if (!options?.background) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Re-sync the worklist when the tab regains focus so a ticket claimed on
  // another screen (ticket detail, tasks) shows up here without a manual
  // refresh. Runs as a background refresh so the list stays visible.
  const refreshInBackground = useCallback(() => {
    void loadConversations({ background: true });
  }, [loadConversations]);
  useRefetchOnFocus(refreshInBackground);

  /**
   * Upsert a ticket pushed in over the real-time hub into the loaded list,
   * keyed by id so an event for a ticket already present (from the initial
   * fetch or a prior event) updates that row in place rather than duplicating
   * it. The `conversations` memo below re-derives the visible worklist from
   * this state, so a merged ticket that isn't mine or is terminal simply
   * doesn't render — the Visibility Rule stays the single source of truth.
   */
  const mergeTicket = useCallback((ticket: TicketListItem) => {
    setTickets((prev) => {
      const index = prev.findIndex((t) => t.id === ticket.id);
      if (index === -1) {
        return [...prev, ticket];
      }
      const next = [...prev];
      next[index] = ticket;
      return next;
    });
  }, []);

  // Live ticket-list events (Staff group): a new ticket appearing or an existing
  // ticket's Status/WaitingOn/assignment changing. `useRefetchOnFocus` remains as
  // a secondary fallback for anything a dropped connection missed.
  useSignalR({
    onNewTicketAvailable: mergeTicket,
    onTicketStatusChanged: mergeTicket,
  });

  /**
   * The Visibility Rule: my active conversations, most-recently-updated first.
   * `currentAgentId === null` (no session) matches nothing, so an
   * unauthenticated view shows an empty worklist rather than everyone's tickets.
   *
   * Terminal (Completed/Canceled) tickets are always excluded here via
   * `isActiveStatus`; the `filter` then narrows within the active set. "All"
   * (the default) keeps every active conversation; "Claimed"/"Ongoing" match on
   * status; "Unread"/"Read" match on whether the conversation is awaiting the
   * agent (`waitingOn === "Agent"`).
   */
  const conversations = useMemo(() => {
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

  /**
   * The open conversation's ticket. Prefer the row already in the loaded list
   * (so the pane has its contact + status without a second fetch); fall back to
   * fetching by id when the URL points at a conversation outside my worklist
   * (a deep-linked colleague's ticket).
   */
  const selectedFromList = selectedTicketId
    ? tickets.find((t) => t.id === selectedTicketId) ?? null
    : null;

  /**
   * Mark a conversation read as soon as it's viewed. "Unread" in this inbox
   * means the conversation is awaiting the agent (`waitingOn === "Agent"` — the
   * "Waiting on you" signal), so opening it flips WaitingOn to `None`: the agent
   * has now seen it but hasn't replied yet (replying is what flips it to
   * `Customer`). Guarded to fire once per ticket and only for a non-terminal
   * row that is actually unread, so it never clobbers a `Customer`/`None` turn
   * and never fires for a terminal (Completed/Canceled) conversation. The
   * returned row is merged locally so the "Waiting on you" badge clears and the
   * Unread filter drops it immediately, without waiting for the hub echo.
   */
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
        const updated = await crmClient.conversationTickets.setWaitingOn(
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

  return (
    // Full-height split workspace: fills the viewport below the app header so
    // the two panels scroll independently (list left, conversation right).
    <div className="w-full h-[calc(100vh-4rem)] min-h-[520px] flex overflow-hidden">
      {/* Left panel: the conversation list (~30%, clamped 320–400px). */}
      <div className="w-[30%] min-w-[320px] max-w-[400px] border-r border-border flex flex-col bg-background">
        {/* Panel header. */}
        <div className="p-md border-b border-border flex justify-between items-center gap-2 shrink-0">
          <h1 className="text-title-lg font-bold flex items-center gap-2">
            <InboxIcon className="w-5 h-5" />
            Inbox
          </h1>
          <Select
            value={filter}
            onValueChange={(value) => setFilter(value as InboxFilter)}
          >
            <SelectTrigger
              className="h-8 w-auto min-w-[110px] text-sm"
              aria-label="Filter conversations"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(INBOX_FILTER_LABELS) as InboxFilter[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {INBOX_FILTER_LABELS[key]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Conversation list body. */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-md space-y-sm">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted animate-pulse"
                  data-testid="conversation-skeleton-row"
                />
              ))}
            </div>
          ) : error ? (
            <div className="p-lg text-base text-destructive">{error}</div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center px-lg py-xl">
              <MessagesSquare className="w-10 h-10 text-muted-foreground mb-md" />
              <p className="text-base text-muted-foreground">
                Nothing to work on right now.
              </p>
            </div>
          ) : (
            <ul aria-label="Conversations" className="min-w-[280px]">
              {conversations.map((ticket) => {
                const isSelected = ticket.id === selectedTicketId;
                return (
                  <li key={ticket.id} className="relative">
                    {/* Accent bar marks the currently-open conversation. */}
                    {isSelected && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary"
                      />
                    )}
                    <button
                      type="button"
                      aria-current={isSelected ? "true" : undefined}
                      onClick={() =>
                        router.push(`/conversations/inbox/${ticket.id}`)
                      }
                      className={`w-full text-left p-md border-b border-border transition-colors flex gap-sm ${
                        isSelected ? "bg-muted" : "hover:bg-muted/50"
                      }`}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="text-sm font-semibold">
                          {conversationInitials(ticket)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-base font-semibold text-foreground truncate">
                            {conversationLabel(ticket)}
                          </h3>
                          <span className="text-sm text-muted-foreground shrink-0">
                            {formatConversationTime(ticket.updatedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-xs">
                          {ticket.subject}
                        </p>
                        <div className="flex items-center gap-2 mt-sm">
                          <Badge variant={STATUS_BADGE_VARIANT[ticket.status]}>
                            {ticket.status}
                          </Badge>
                          {ticket.waitingOn === "Agent" && (
                            <Badge variant="secondary">Waiting on you</Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Right panel: the open conversation, or the empty state. */}
      <div
        className="flex-1 min-w-0 flex flex-col bg-muted/20"
        data-testid="conversation-pane"
      >
        {selectedTicketId ? (
          <ConversationPane
            ticketId={selectedTicketId}
            ticket={selectedFromList}
            listLoaded={!isLoading && error === null}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-xl">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-md">
              <MessagesSquare className="w-8 h-8" />
            </div>
            <h2 className="text-headline-sm font-semibold text-foreground mb-sm">
              No Conversation Selected
            </h2>
            <p className="text-base text-muted-foreground">
              Select a conversation from the inbox on the left to start
              messaging, view ticket details, and manage contact history.
            </p>
          </div>
        )}
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
