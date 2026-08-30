"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import {
  MessageGroupRow,
  ReplyBox,
  groupMessages,
} from "@/components/features/conversations/MessageThreadParts";

interface MessageThreadProps {
  ticketId: string;
  /** The ticket's own contact name; every Contact-authored bubble uses it. */
  contactName: string | null;
  /** Whether the ticket's Status is terminal (Completed/Canceled). */
  isTerminal: boolean;
  /** Called after a reply is successfully sent (parent flips WaitingOn). */
  onMessageSent: () => void;
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
  isTerminal,
  onMessageSent,
}: MessageThreadProps) {
  const { data: session } = useSession();
  const { messages, isLoading, error, sendMessage } =
    useConversationMessages(ticketId);

  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !isSending && !isTerminal;

  // Auto-scroll to the newest message whenever the thread grows (on load,
  // on poll-merge, and after an optimistic send) — messenger behavior.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    if (!canSend) return;

    // Same session-identity source the Claim action already uses.
    const staffId = session?.user?.id ?? session?.user?.username ?? "";
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

  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-md p-lg">
        <CardTitle className="text-title-lg font-bold">Messages</CardTitle>
      </CardHeader>
      <CardContent className="p-lg pt-0">
        {error && <p className="mb-md text-base text-destructive">{error}</p>}

        {/* Scrollable message viewport — the composer below is pinned outside it. */}
        <div
          className="flex flex-col gap-lg h-[480px] overflow-y-auto rounded-lg border border-border bg-muted/30 p-md"
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

        <ReplyBox
          draft={draft}
          onDraftChange={setDraft}
          onSend={handleSend}
          canSend={canSend}
          isSending={isSending}
          disabled={isTerminal}
        />
      </CardContent>
    </Card>
  );
}
