"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { formatName } from "@/lib/format-display";
import { cn } from "@/lib/utils";
import type { ConversationMessage } from "@/types/conversation-message";

interface MessageThreadProps {
  ticketId: string;
  /** The ticket's own contact name; every Contact-authored bubble uses it. */
  contactName: string | null;
  /** Whether the ticket's Status is terminal (Completed/Canceled). */
  isTerminal: boolean;
  /** Called after a reply is successfully sent (parent flips WaitingOn). */
  onMessageSent: () => void;
}

/** Fallback label for a Contact-authored message when the ticket has no linked contact. */
const CONTACT_FALLBACK_LABEL = "Customer";

function formatSentAt(sentAt: string): string {
  const date = new Date(sentAt);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

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

  const trimmed = draft.trim();
  const canSend = trimmed.length > 0 && !isSending && !isTerminal;

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

  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-md p-lg">
        <CardTitle className="text-title-lg font-bold">Messages</CardTitle>
      </CardHeader>
      <CardContent className="p-lg pt-0 space-y-md">
        {error && <p className="text-base text-destructive">{error}</p>}

        {isLoading && messages.length === 0 ? (
          <p className="text-base text-muted-foreground">Loading messages…</p>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-xl text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground mb-md" />
            <p className="text-base text-muted-foreground">
              No messages yet. Replies you send will appear here.
            </p>
          </div>
        ) : (
          <div
            className="flex flex-col gap-md max-h-[600px] overflow-y-auto"
            role="log"
            aria-label="Message thread"
          >
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                contactName={contactName}
              />
            ))}
          </div>
        )}

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

interface ReplyBoxProps {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  canSend: boolean;
  isSending: boolean;
  disabled: boolean;
}

/**
 * The staff reply composer. Disabled (not hidden) on a terminal ticket, so
 * the thread stays readable while the conversation is closed. Sending is
 * blocked for empty/whitespace-only content (mirrors the backend's check).
 */
function ReplyBox({
  draft,
  onDraftChange,
  onSend,
  canSend,
  isSending,
  disabled,
}: ReplyBoxProps) {
  return (
    <div className="space-y-sm border-t border-border pt-md">
      <Textarea
        aria-label="Reply"
        placeholder={
          disabled
            ? "This ticket is closed."
            : "Type a reply…"
        }
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        disabled={disabled || isSending}
        className="resize-none h-24 text-base"
      />
      <div className="flex justify-end">
        <Button onClick={onSend} disabled={!canSend} size="sm">
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="ml-1">Send</span>
        </Button>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ConversationMessage;
  contactName: string | null;
}

/**
 * A single chat bubble. Staff messages sit on the right (primary background);
 * Contact messages sit on the left. Contact bubbles always show the ticket's
 * own contact name (falling back to "Customer"), never a per-message identity
 * — `MessageDto` carries no per-message display name.
 */
function MessageBubble({ message, contactName }: MessageBubbleProps) {
  const isStaff = message.senderType === "Staff";
  const senderLabel = isStaff
    ? formatName(message.senderStaffName) ?? "Staff"
    : formatName(contactName) ?? CONTACT_FALLBACK_LABEL;

  return (
    <div
      className={cn(
        "flex flex-col max-w-[85%]",
        isStaff ? "items-end self-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 mb-1",
          isStaff ? "pr-1 flex-row-reverse" : "pl-1"
        )}
      >
        <span className="text-base font-semibold text-foreground">
          {senderLabel}
        </span>
        <span className="text-sm text-muted-foreground">
          {formatSentAt(message.sentAt)}
        </span>
      </div>
      <div
        className={cn(
          "rounded-xl p-md text-base whitespace-pre-wrap break-words",
          isStaff
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground border border-border rounded-tl-sm"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
