"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Inbox as InboxIcon, MessagesSquare } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { conversationTicketsApi } from "@/features/conversations/services/conversations-api";
import { useCurrentAgentId } from "@/hooks/use-current-agent-id";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { useSignalR } from "@/hooks/use-signal-r";
import { isActiveStatus } from "@/features/conversations/services/tickets";
import type { TicketListItem } from "@/features/conversations/types";
import { ConversationListItems } from "@/features/conversations/components/conversation-list-items";
import { ConversationPane } from "@/features/conversations/components/conversation-pane";
import { useMarkConversationRead } from "@/features/conversations/hooks/use-mark-conversation-read";
import {
  type InboxFilter,
  INBOX_FILTER_LABELS,
} from "@/features/conversations/lib/inbox-types";
import { useInboxFilter } from "@/features/conversations/hooks/use-inbox-filter";

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
      const result = await conversationTicketsApi.list();
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
  const conversations = useInboxFilter(tickets, currentAgentId, filter);

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
  useMarkConversationRead(selectedTicketId, selectedFromList, mergeTicket);

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
            <ConversationListItems
              conversations={conversations}
              selectedTicketId={selectedTicketId}
            />
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



