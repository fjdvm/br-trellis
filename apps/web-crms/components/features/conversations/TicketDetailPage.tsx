"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { LucideIcon } from "lucide-react";
import { Loader2, UserPlus, UserMinus, ChevronRight, XCircle } from "lucide-react";
import { DetailSkeleton } from "@/components/shared/DetailSkeleton";
import { BackButton } from "@/components/shared/BackButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { crmClient } from "@/lib/api/crm-client";
import { STATUS_BADGE_VARIANT } from "@/lib/tickets";
import { MessageThread } from "@/components/features/conversations/MessageThread";
import { formatName, formatEmail } from "@/lib/format-display";
import type {
  TicketDetail,
  TicketStatus,
  TicketWaitingOn,
} from "@/types/ticket-detail";

interface TicketDetailPageProps {
  ticketId: string;
}

/** The single forward status advance for a claimable/in-progress ticket. */
const NEXT_STATUS: Partial<Record<TicketStatus, TicketStatus>> = {
  Claimed: "Ongoing",
  Ongoing: "Completed",
};

/** The three WaitingOn values a ticket can point at (mirrors the backend enum). */
const WAITING_ON_OPTIONS: TicketWaitingOn[] = ["Agent", "Customer", "None"];

/** Which in-flight mutation is running, so we can disable the right control. */
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
  return ticket.status === "Claimed" || ticket.status === "Ongoing";
}

function isTerminal(ticket: TicketDetail): boolean {
  return ticket.status === "Completed" || ticket.status === "Canceled";
}

export function TicketDetailPage({ ticketId }: TicketDetailPageProps) {
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const loadTicket = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await crmClient.conversationTickets.getById(ticketId);
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
    const staffId = session?.user?.id ?? session?.user?.username;
    void runMutation("claim", () =>
      crmClient.conversationTickets.claim(ticketId, {
        staffId: staffId ?? "",
        staffName: session?.user?.name ?? "",
        staffEmail: session?.user?.email ?? "",
      })
    );
  }

  function handleUnclaim() {
    void runMutation("unclaim", () =>
      crmClient.conversationTickets.unclaim(ticketId)
    );
  }

  function handleAdvance(next: TicketStatus) {
    void runMutation("advance", () =>
      crmClient.conversationTickets.changeStatus(ticketId, { status: next })
    );
  }

  function handleCancelConfirmed() {
    setShowCancelDialog(false);
    void runMutation("cancel", () =>
      crmClient.conversationTickets.changeStatus(ticketId, { status: "Canceled" })
    );
  }

  function handleSetWaitingOn(value: TicketWaitingOn) {
    void runMutation("waitingOn", () =>
      crmClient.conversationTickets.setWaitingOn(ticketId, { waitingOn: value })
    );
  }

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (loadError || !ticket) {
    return (
      <div className="w-full min-h-full py-xl px-lg md:px-xl max-w-7xl mx-auto">
        <BackButton fallbackHref="/conversations/tickets" />
        <div className="p-xl text-destructive">
          {loadError ?? "Ticket not found."}
        </div>
      </div>
    );
  }

  const next = NEXT_STATUS[ticket.status];
  const busy = pending !== null;

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <BackButton fallbackHref="/conversations/tickets" />

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
            </div>
            <p className="text-body-md text-muted-foreground">
              Assigned to {formatName(ticket.assignedToName) ?? "\u2014"}
              {ticket.assignedToEmail
                ? ` \u00b7 ${formatEmail(ticket.assignedToEmail)}`
                : ""}
            </p>
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

              {isActive(ticket) && (
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

              <ActionButton
                label="Cancel Ticket"
                icon={XCircle}
                variant="destructive"
                loading={pending === "cancel"}
                disabled={busy}
                onClick={() => setShowCancelDialog(true)}
              />
            </div>
          )}
        </div>

        {actionError && (
          <p className="text-base text-destructive">{actionError}</p>
        )}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Details</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0 space-y-md">
          <div className="grid grid-cols-2 gap-md text-base items-center">
            <div className="text-muted-foreground">Waiting On</div>
            <div>
              <Select
                value={ticket.waitingOn}
                onValueChange={(value) =>
                  handleSetWaitingOn(value as TicketWaitingOn)
                }
                disabled={pending === "waitingOn" || isTerminal(ticket)}
              >
                <SelectTrigger
                  className="w-[160px]"
                  aria-label="Set waiting on"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WAITING_ON_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-muted-foreground">Assignee</div>
            <div>{formatName(ticket.assignedToName) ?? "\u2014"}</div>
            <div className="text-muted-foreground">Assignee email</div>
            <div>{formatEmail(ticket.assignedToEmail) ?? "\u2014"}</div>
          </div>

          {ticket.contact && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-md text-base">
                <div className="text-muted-foreground">Contact</div>
                <div>{formatName(ticket.contact.name) ?? "\u2014"}</div>
                <div className="text-muted-foreground">Contact email</div>
                <div>{formatEmail(ticket.contact.email) ?? "\u2014"}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <MessageThread
        ticketId={ticketId}
        contactName={ticket.contact?.name ?? null}
        isTerminal={isTerminal(ticket)}
        onMessageSent={() => handleSetWaitingOn("Customer")}
      />

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this ticket? Canceling is terminal
              and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Ticket</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleCancelConfirmed}>
              Cancel Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  icon: LucideIcon;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  variant?: "default" | "outline" | "destructive";
}

/** A ticket action button: swaps its icon for a spinner while its mutation runs. */
function ActionButton({
  label,
  icon: Icon,
  loading,
  disabled,
  onClick,
  variant = "default",
}: ActionButtonProps) {
  return (
    <Button variant={variant} size="sm" onClick={onClick} disabled={disabled}>
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      <span className="ml-1">{label}</span>
    </Button>
  );
}
