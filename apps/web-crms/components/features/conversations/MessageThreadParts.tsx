"use client";

import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatName } from "@/lib/format-display";
import { cn } from "@/lib/utils";
import type { ConversationMessage } from "@/types/conversation-message";

/** Fallback label for a Contact-authored message when the ticket has no linked contact. */
export const CONTACT_FALLBACK_LABEL = "Customer";

/** A run of consecutive messages from the same sender (messenger grouping). */
export interface MessageGroup {
  key: string;
  isStaff: boolean;
  senderLabel: string;
  messages: ConversationMessage[];
}

function formatSentAt(sentAt: string): string {
  const date = new Date(sentAt);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

/** First one or two initials from a display label (e.g. "Jane Doe" -> "JD"). */
export function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]!.toUpperCase();
  return (parts[0][0]! + parts[parts.length - 1][0]!).toUpperCase();
}

/** The display name for a message's sender (Staff name, or the ticket contact). */
export function senderLabelFor(
  message: ConversationMessage,
  contactName: string | null
): string {
  if (message.senderType === "Staff") {
    return formatName(message.senderStaffName) ?? "Staff";
  }
  return formatName(contactName) ?? CONTACT_FALLBACK_LABEL;
}

/**
 * Collapse a chronological message list into runs of consecutive messages
 * from the same sender — the grouping a messenger UI uses to show one avatar
 * and one name/timestamp header per run instead of repeating them per bubble.
 */
export function groupMessages(
  messages: ConversationMessage[],
  contactName: string | null
): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const message of messages) {
    const isStaff = message.senderType === "Staff";
    const last = groups[groups.length - 1];
    if (last && last.isStaff === isStaff) {
      last.messages.push(message);
    } else {
      groups.push({
        key: message.id,
        isStaff,
        senderLabel: senderLabelFor(message, contactName),
        messages: [message],
      });
    }
  }
  return groups;
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
 * The staff reply composer, pinned below the scrollable thread. Disabled (not
 * hidden) on a terminal ticket so history stays readable. Empty/whitespace
 * content is blocked. Enter sends; Shift+Enter inserts a newline (messenger
 * convention).
 */
export function ReplyBox({
  draft,
  onDraftChange,
  onSend,
  canSend,
  isSending,
  disabled,
}: ReplyBoxProps) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="mt-md flex items-end gap-sm">
      <Textarea
        aria-label="Reply"
        placeholder={disabled ? "This ticket is closed." : "Type a reply…"}
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSending}
        rows={1}
        className="min-h-[44px] max-h-32 resize-none text-base"
      />
      <Button
        onClick={onSend}
        disabled={!canSend}
        size="icon"
        aria-label="Send"
        className="h-11 w-11 shrink-0 rounded-full"
      >
        {isSending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
      </Button>
    </div>
  );
}

interface MessageGroupRowProps {
  group: MessageGroup;
}

/**
 * One sender's consecutive run: an avatar (initials) beside a column of
 * bubbles, with the sender name + timestamp shown once above the run. Staff
 * runs sit on the right (primary bubbles); Contact runs on the left.
 */
export function MessageGroupRow({ group }: MessageGroupRowProps) {
  const { isStaff, senderLabel, messages } = group;
  const initials = initialsOf(senderLabel);
  const lastSentAt = messages[messages.length - 1]!.sentAt;

  return (
    <div
      className={cn(
        "flex items-end gap-sm",
        isStaff ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarFallback
          className={cn(
            "text-sm font-semibold",
            isStaff
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground"
          )}
        >
          {initials}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex flex-col gap-1 max-w-[75%]",
          isStaff ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2 px-1",
            isStaff ? "flex-row-reverse" : "flex-row"
          )}
        >
          <span className="text-base font-semibold text-foreground">
            {senderLabel}
          </span>
          <span className="text-sm text-muted-foreground">
            {formatSentAt(lastSentAt)}
          </span>
        </div>

        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            content={message.content}
            isStaff={isStaff}
            isFirst={index === 0}
          />
        ))}
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  content: string;
  isStaff: boolean;
  isFirst: boolean;
}

/** A single chat bubble within a sender's group. */
function MessageBubble({ content, isStaff, isFirst }: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "rounded-2xl px-md py-sm text-base whitespace-pre-wrap break-words shadow-sm",
        isStaff
          ? "bg-primary text-primary-foreground"
          : "bg-background text-foreground border border-border",
        // Tuck the top corner nearest the avatar only on the first bubble of a
        // run, so a grouped run reads as one connected column.
        isFirst && (isStaff ? "rounded-tr-sm" : "rounded-tl-sm")
      )}
    >
      {content}
    </div>
  );
}
