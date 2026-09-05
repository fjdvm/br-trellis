"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { STATUS_BADGE_VARIANT } from "@/lib/tickets";
import { formatConversationTime } from "@/lib/format-conversation-time";
import { formatName, formatEmail } from "@/lib/format-display";
import type { TicketListItem } from "@/types/ticket-list";

export interface ConversationListItemsProps {
  conversations: TicketListItem[];
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

export function ConversationListItems({
  conversations,
  selectedTicketId,
}: ConversationListItemsProps) {
  const router = useRouter();

  return (
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
              onClick={() => router.push(`/conversations/inbox/${ticket.id}`)}
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
  );
}
