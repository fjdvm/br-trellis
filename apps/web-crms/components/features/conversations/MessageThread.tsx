"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { useCurrentAgentId } from "@/hooks/useCurrentAgentId";
import { useSignalR } from "@/hooks/useSignalR";
import { formatName, formatEmail } from "@/lib/format-display";
import {
  MessageGroupRow,
  ReplyBox,
  groupMessages,
} from "@/components/features/conversations/MessageThreadParts";
import { CannedReplyPicker } from "@/components/features/conversations/CannedReplyPicker";
import {
  ConversationActionsMenu,
  type ConversationAction,
} from "@/components/features/conversations/ConversationActionsMenu";
import { substituteCannedReplyVariables } from "@/lib/canned-reply-substitution";
import type { TicketStatus } from "@/types/ticket-detail";

interface MessageThreadProps {
  ticketId: string;
  /** The ticket's own contact name; every Contact-authored bubble uses it. */
  contactName: string | null;
  /** The ticket's contact email; used as the thread title when there's no name. */
  contactEmail?: string | null;
  /**
   * The ticket's subject, shown in the conversation header subtitle
   * ("Conversation • <subject>"). Optional — omitted callers get just the name.
   */
  ticketSubject?: string | null;
  /** Whether the ticket's Status is terminal (Completed/Canceled). */
  isTerminal: boolean;
  /** Called after a reply is successfully sent (parent flips WaitingOn). */
  onMessageSent: () => void;
  /**
   * The ticket's current Status. When provided together with `onAction`, the
   * header shows a 3-dot lifecycle menu (Mark Ongoing / Complete / Cancel /
   * Unclaim). Omit both to render a plain header with no actions.
   */
  status?: TicketStatus;
  /** Invoked with the chosen lifecycle action after the user confirms it. */
  onAction?: (action: ConversationAction) => void;
  /** True while a lifecycle mutation is running; disables the actions menu. */
  actionBusy?: boolean;
}

/**
 * The thread's card title: the customer's name, falling back to their email,
 * then to a generic "Messages" label when the ticket has no linked contact.
 */
function threadTitle(
  contactName: string | null,
  contactEmail: string | null | undefined
): string {
  return (
    formatName(contactName) ?? formatEmail(contactEmail) ?? "Messages"
  );
}

/** Up-to-two-letter initials for the header avatar. */
function threadInitials(title: string): string {
  const parts = title.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}

/**
 * Messenger-style message thread for the ticket detail page: sender avatars,
 * consecutive-message grouping, a scrollable viewport that auto-scrolls to the
 * newest message, and a pinned composer (Enter to send, Shift+Enter for a
 * newline). Built against #66's real GET/POST /tickets/{id}/messages contract.
 */
export function MessageThread({
  ticketId,
  contactName,
  contactEmail = null,
  ticketSubject = null,
  isTerminal,
  onMessageSent,
  status,
  onAction,
  actionBusy = false,
}: MessageThreadProps) {
  const { data: session } = useSession();
  const currentAgentId = useCurrentAgentId();
  const { messages, isLoading, error, sendMessage, appendMessage } =
    useConversationMessages(ticketId);

  // Real-time push: a new message on this ticket's thread (a staff reply from
  // another agent, an inbound email, or an inbound shop-chat message) is
  // appended live. `appendMessage` de-dups by id, so this agent's own reply —
  // already shown optimistically and reconciled via the POST response — is not
  // duplicated when its own broadcast arrives back. The 60s fallback poll in
  // useConversationMessages still recovers anything a dropped connection missed.
  useSignalR({ ticketId, onReceiveMessage: appendMessage });

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !isSending && !isTerminal;

  // Auto-scroll to the newest message whenever the thread grows (on load,
  // on poll-merge, and after an optimistic send) — messenger behavior.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!canSend) return;

    // Shared, session-stable identity source (employee code first) — the same
    // value Claim and the ownership filters use, so message authorship keys to
    // the same stable id.
    const staffId = currentAgentId ?? "";
    const staffName = session?.user?.name ?? "";

    setIsSending(true);
    try {
      await sendMessage({
        senderStaffId: staffId,
        senderStaffName: staffName,
        content: trimmed,
      });
      // Only clear the draft on success; a failed send preserves it (the
      // hook surfaces the error via its `error` state).
      setDraft("");
      onMessageSent();
    } catch {
      // Error already surfaced by the hook; leave the draft intact for retry.
    } finally {
      setIsSending(false);
    }
  }

  const groups = groupMessages(messages, contactName);
  const title = threadTitle(contactName, contactEmail);

  // Insert a selected canned reply's body — with {{customer_name}}, {{ticket_id}}
  // and {{agent_name}} substituted from data already in scope here — at the
  // textarea's current cursor position, preserving any draft already typed.
  function handleInsertCannedReply(rawBody: string) {
    const substituted = substituteCannedReplyVariables(rawBody, {
      customerName: contactName,
      ticketId,
      agentName: session?.user?.name ?? "",
    });

    const textarea = textareaRef.current;
    const hasSelection =
      textarea &&
      textarea.selectionStart !== null &&
      textarea.selectionEnd !== null;
    const start = hasSelection ? textarea.selectionStart : draft.length;
    const end = hasSelection ? textarea.selectionEnd : draft.length;

    const next = draft.slice(0, start) + substituted + draft.slice(end);
    setDraft(next);

    // Restore focus and place the caret just after the inserted text.
    if (textarea) {
      const caret = start + substituted.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(caret, caret);
      });
    }
  }

  return (
    // Fills the conversation pane; header pinned top, thread scrolls, composer
    // pinned bottom — the messenger layout from conversation_detail_wireframe.
    <div className="flex h-full min-h-0 flex-col">
      {/* Conversation header: avatar + contact name + ticket subtitle, with a
          3-dot lifecycle actions menu pinned to the right when enabled. */}
      <div className="flex items-center gap-sm border-b border-border p-md shrink-0 bg-background">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="text-sm font-semibold">
            {threadInitials(title)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h2 className="text-title-lg font-bold text-foreground truncate">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            {ticketSubject ? `Conversation \u00b7 ${ticketSubject}` : "Conversation"}
          </p>
        </div>
        {status && onAction && (
          <ConversationActionsMenu
            status={status}
            busy={actionBusy}
            onAction={onAction}
          />
        )}
      </div>

      {error && (
        <p className="px-md pt-md text-base text-destructive shrink-0">{error}</p>
      )}

      {/* Scrollable message viewport — grows to fill the pane; the composer
          below is pinned outside it. */}
      <div
        className="flex-1 min-h-0 flex flex-col gap-lg overflow-y-auto bg-muted/20 p-md"
        role="log"
        aria-label="Message thread"
      >
        {isLoading && messages.length === 0 ? (
          <p className="text-base text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-md" />
            <p className="text-base text-muted-foreground">
              No messages yet. Replies you send will appear here.
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <MessageGroupRow key={group.key} group={group} />
          ))
        )}
        <div ref={bottomRef} data-testid="thread-bottom" />
      </div>

      <div className="border-t border-border p-md shrink-0 bg-background">
        <ReplyBox
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
          canSend={canSend}
          isSending={isSending}
          disabled={isTerminal}
          textareaRef={textareaRef}
          pickerSlot={
            <CannedReplyPicker
              disabled={isTerminal}
              onSelect={handleInsertCannedReply}
            />
          }
        />
      </div>
    </div>
  );
}
