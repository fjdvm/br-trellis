"use client";

import { useState } from "react";
import { MoreVertical, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TicketStatus } from "@/types/ticket-detail";

/**
 * The four lifecycle actions the conversation header's 3-dot menu offers.
 * `ongoing`/`complete`/`cancel` map to a Status change (Ongoing / Completed /
 * Canceled); `unclaim` releases ownership. Mirrors the ticket detail page's
 * lifecycle controls, surfaced inline in the conversation header.
 */
export type ConversationAction = "ongoing" | "complete" | "cancel" | "unclaim";

/** Copy for each action: menu label + confirmation modal title/body/CTA. */
interface ActionCopy {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  /** A destructive confirm (Cancel) uses the destructive button variant. */
  destructive?: boolean;
}

const ACTION_COPY: Record<ConversationAction, ActionCopy> = {
  ongoing: {
    label: "Mark as Ongoing",
    title: "Mark conversation as Ongoing",
    description:
      "This moves the ticket into the Ongoing state, signalling work is actively in progress.",
    confirmLabel: "Mark Ongoing",
  },
  complete: {
    label: "Mark as Complete",
    title: "Mark conversation as Complete",
    description:
      "This completes the ticket. Completing is terminal — the conversation moves out of your active inbox.",
    confirmLabel: "Mark Complete",
  },
  cancel: {
    label: "Cancel Ticket",
    title: "Cancel this ticket",
    description:
      "Are you sure you want to cancel this ticket? Canceling is terminal and cannot be undone.",
    confirmLabel: "Cancel Ticket",
    destructive: true,
  },
  unclaim: {
    label: "Unclaim",
    title: "Unclaim this conversation",
    description:
      "This releases the ticket back to the unclaimed queue so another agent can pick it up. It will leave your inbox.",
    confirmLabel: "Unclaim",
  },
};

interface ConversationActionsMenuProps {
  /** Current ticket status — gates which actions are offered/enabled. */
  status: TicketStatus;
  /** True while a lifecycle mutation is running; disables the trigger + confirm. */
  busy: boolean;
  /** Invoked with the chosen action after the user confirms in the modal. */
  onAction: (action: ConversationAction) => void;
}

/**
 * Which lifecycle actions apply to a ticket in the given status. Terminal
 * tickets (Completed/Canceled) offer none. Active tickets (Claimed/Ongoing)
 * offer Cancel and Unclaim always; "Mark Ongoing" only when not already
 * Ongoing; "Mark Complete" always (both Claimed and Ongoing can complete).
 */
function availableActions(status: TicketStatus): ConversationAction[] {
  if (status === "Completed" || status === "Canceled") return [];
  const actions: ConversationAction[] = [];
  if (status !== "Ongoing") actions.push("ongoing");
  actions.push("complete");
  actions.push("unclaim");
  actions.push("cancel");
  return actions;
}

/**
 * The conversation header's 3-dot lifecycle menu. Opening it lists the actions
 * valid for the ticket's current status; picking one opens a confirmation modal
 * before the mutation fires (so a terminal action like Cancel/Complete is never
 * a single mis-click). Renders nothing when no action applies (terminal ticket).
 */
export function ConversationActionsMenu({
  status,
  busy,
  onAction,
}: ConversationActionsMenuProps) {
  // The action awaiting confirmation in the modal, or null when closed.
  const [pendingAction, setPendingAction] = useState<ConversationAction | null>(
    null
  );

  const actions = availableActions(status);
  if (actions.length === 0) return null;

  const copy = pendingAction ? ACTION_COPY[pendingAction] : null;

  function handleConfirm() {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);
    onAction(action);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Conversation actions"
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <MoreVertical className="h-5 w-5" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[200px] border border-border">
          {actions.map((action) => (
            <DropdownMenuItem
              key={action}
              className={
                action === "cancel"
                  ? "text-base font-normal text-destructive focus:text-destructive"
                  : "text-base font-normal"
              }
              onSelect={(event) => {
                // Keep the modal open cleanly after the menu closes.
                event.preventDefault();
                setPendingAction(action);
              }}
            >
              <span>{ACTION_COPY[action].label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={pendingAction !== null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
      >
        <DialogContent className="border border-border sm:max-w-[440px]">
          {copy && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-medium">
                  {copy.title}
                </DialogTitle>
                <DialogDescription>{copy.description}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setPendingAction(null)}
                >
                  Dismiss
                </Button>
                <Button
                  variant={copy.destructive ? "destructive" : "default"}
                  onClick={handleConfirm}
                >
                  {copy.confirmLabel}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
