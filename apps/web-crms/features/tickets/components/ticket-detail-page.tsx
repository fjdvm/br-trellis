"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  UserPlus,
  UserMinus,
  ChevronRight,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { ActionButton } from "../../../features/conversations/inbox/components/action-button";
import { DetailSkeleton } from "@/components/shared/detail-skeleton";
import { BackButton } from "@/components/shared/back-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TicketCancelDialog } from "./ticket-cancel-dialog";
import { conversationTicketsApi } from "@/features/conversations";
import { useCurrentAgentId } from "@/hooks/use-current-agent-id";
import { STATUS_BADGE_VARIANT, SOURCE_BADGE_VARIANT, isActiveStatus, isTerminalStatus } from "../services/tickets";
import { formatName, formatEmail } from "@/lib/format-display";
import type {
  TicketDetail,
  TicketStatus,
  TicketWaitingOn,
} from "../types/ticket-detail";
import { TicketDetailsSidebar } from "./ticket-details-sidebar";

interface TicketDetailPageProps {
  ticketId: string;
}

const NEXT_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  Claimed: "Ongoing",
  Ongoing: "Completed",
};

type PendingAction =
  | "claim"
  | "unclaim"
  | "advance"
  | "cancel"
  | "waitingOn"
  | null;

function isClaimable(ticket: TicketDetail): boolean {
  return (
    ticket.status === "Unclaimed" ||
    (ticket.status === "Ongoing" && ticket.assignedToId === null)
  );
}

function isActive(ticket: TicketDetail): boolean {
  return isActiveStatus(ticket.status);
}

function isTerminal(ticket: TicketDetail): boolean {
  return isTerminalStatus(ticket.status);
}

function canActOnTicket(
  ticket: TicketDetail,
  currentAgentId: string | null
): boolean {
  if (ticket.assignedToId == null) return true;
  return currentAgentId != null && ticket.assignedToId === currentAgentId;
}

export function TicketDetailPage({ ticketId }: TicketDetailPageProps) {
  const { data: session } = useSession();
  const currentAgentId = useCurrentAgentId();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const loadTicket = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await conversationTicketsApi.getById(ticketId);
      setTicket(result);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Unable to load ticket.");
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    void loadTicket();
  }, [loadTicket]);

  async function runMutation(
    action: PendingAction,
    mutate: () => Promise<TicketDetail>
  ) {
    setPending(action);
    setActionError(null);
    try {
      const updated = await mutate();
      setTicket(updated);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setPending(null);
    }
  }

  function handleClaim() {
    void runMutation("claim", () =>
      conversationTicketsApi.claim(ticketId, {
        staffId: currentAgentId ?? "",
        staffName: session?.user?.name ?? "",
        staffEmail: session?.user?.email ?? "",
      })
    );
  }

  function handleUnclaim() {
    void runMutation("unclaim", () =>
      conversationTicketsApi.unclaim(ticketId)
    );
  }

  function handleAdvance(next: TicketStatus) {
    void runMutation("advance", () =>
      conversationTicketsApi.changeStatus(ticketId, { status: next })
    );
  }

  function handleCancelConfirmed() {
    setShowCancelDialog(false);
    void runMutation("cancel", () =>
      conversationTicketsApi.changeStatus(ticketId, { status: "Canceled" })
    );
  }

  function handleSetWaitingOn(value: TicketWaitingOn) {
    void runMutation("waitingOn", () =>
      conversationTicketsApi.setWaitingOn(ticketId, { waitingOn: value })
    );
  }

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (loadError || !ticket) {
    return (
      <div className="w-full min-h-full py-xl px-lg md:px-xl mx-auto">
        <BackButton fallbackHref="/tickets" />
        <div className="p-xl text-destructive">
          {loadError ?? "Ticket not found."}
        </div>
      </div>
    );
  }

  const next = NEXT_STATUS[ticket.status];
  const busy = pending !== null;
  // Owner-only gate: Unclaim / advance / Cancel are available on a claimed
  // ticket only to the agent who owns it (unowned tickets are open to anyone).
  const canAct = canActOnTicket(ticket, currentAgentId);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <BackButton fallbackHref="/tickets" />

      <div className="space-y-sm">
        <div className="flex items-start justify-between gap-md">
          <div className="space-y-sm">
            <div className="flex items-center gap-sm">
              <h1 className="text-headline-md font-bold tracking-tight text-foreground">
                {ticket.subject}
              </h1>
              <Badge variant={STATUS_BADGE_VARIANT[ticket.status]}>
                {ticket.status}
              </Badge>
              <Badge variant={SOURCE_BADGE_VARIANT[ticket.source]}>
                {ticket.source}
              </Badge>
            </div>
            <p className="text-body-md text-muted-foreground">
              Assigned to {formatName(ticket.assignedToName) ?? "\u2014"}
              {ticket.assignedToEmail
                ? ` \u00b7 ${formatEmail(ticket.assignedToEmail)}`
                : ""}
            </p>
            {ticket.status === "Canceled" && ticket.canceledBy && (
              <p className="text-body-md font-medium text-destructive" data-testid="cancel-attribution">
                {ticket.canceledBy} cancelled the ticket
              </p>
            )}
          </div>

          {!isTerminal(ticket) && (
            <div className="flex items-center gap-2 shrink-0">
              {isClaimable(ticket) && (
                <ActionButton
                  label="Claim"
                  icon={UserPlus}
                  loading={pending === "claim"}
                  disabled={busy}
                  onClick={handleClaim}
                />
              )}

              {canAct && isActive(ticket) && (
                <>
                  <ActionButton
                    label="Unclaim"
                    icon={UserMinus}
                    variant="outline"
                    loading={pending === "unclaim"}
                    disabled={busy}
                    onClick={handleUnclaim}
                  />

                  {next && (
                    <ActionButton
                      label={`Mark ${next}`}
                      icon={ChevronRight}
                      loading={pending === "advance"}
                      disabled={busy}
                      onClick={() => handleAdvance(next)}
                    />
                  )}
                </>
              )}

              {canAct && (
                <ActionButton
                  label="Cancel Ticket"
                  icon={XCircle}
                  variant="destructive"
                  loading={pending === "cancel"}
                  disabled={busy}
                  onClick={() => setShowCancelDialog(true)}
                />
              )}
            </div>
          )}
        </div>

        {actionError && (
          <p className="text-base text-destructive">{actionError}</p>
        )}
      </div>

      {isActive(ticket) && (
        <Card className="shadow-none border-border">
          <CardContent className="flex flex-col gap-md p-lg sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-sm">
              <MessageSquare className="w-5 h-5 text-muted-foreground shrink-0" />
              <div className="space-y-xs">
                <p className="text-base font-medium text-foreground">
                  Conversation
                </p>
                <p className="text-sm text-muted-foreground">
                  Open this ticket&apos;s conversation in the Conversations
                  section.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href={`/conversations/inbox/${ticketId}`}>
                <MessageSquare className="w-4 h-4" />
                <span className="ml-1">View Conversation</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-lg items-start">
        <TicketDetailsSidebar
          ticket={ticket}
          pending={pending}
          isTerminal={isTerminal(ticket)}
          onSetWaitingOn={handleSetWaitingOn}
        />
      </div>

      <TicketCancelDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        onConfirm={handleCancelConfirmed}
      />
    </div>
  );
}


