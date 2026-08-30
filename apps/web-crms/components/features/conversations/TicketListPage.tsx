"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Ticket as TicketIcon, Loader2, UserPlus, XCircle } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { crmClient } from "@/lib/api/crm-client";
import { STATUS_BADGE_VARIANT } from "@/lib/tickets";
import { formatName, formatEmail } from "@/lib/format-display";
import type {
  TicketListItem,
  TicketStatus,
  TicketWaitingOn,
} from "@/types/ticket-list";

const STATUS_OPTIONS: readonly (TicketStatus | "All")[] = [
  "All",
  "Unclaimed",
  "Claimed",
  "Ongoing",
  "Completed",
  "Canceled",
];

const WAITING_ON_OPTIONS: readonly (TicketWaitingOn | "All")[] = [
  "All",
  "Agent",
  "Customer",
  "None",
];

/** Which in-flight row mutation is running, keyed to a ticket id. */
type RowPending = { id: string; action: "claim" | "cancel" } | null;

function contactLabel(ticket: TicketListItem): string {
  const name = formatName(ticket.contact?.name);
  if (name) return name;
  const email = formatEmail(ticket.contact?.email);
  if (email) return email;
  return "\u2014";
}

function assignedLabel(ticket: TicketListItem): string {
  const name = formatName(ticket.assignedToName);
  return name ?? "Unassigned";
}

/** Unclaimed, or an Ongoing ticket nobody owns yet, can be claimed. */
function isClaimable(ticket: TicketListItem): boolean {
  return (
    ticket.status === "Unclaimed" ||
    (ticket.status === "Ongoing" && ticket.assignedToId === null)
  );
}

/** Completed/Canceled tickets are terminal — no row actions apply. */
function isTerminal(ticket: TicketListItem): boolean {
  return ticket.status === "Completed" || ticket.status === "Canceled";
}

/**
 * Optional props that let a screen reuse this component as a pre-filtered
 * variant (e.g. the Inbox screen) without forking it. Every prop is optional,
 * so the default Tickets screen renders exactly as before when none are passed.
 */
export interface TicketListPageProps {
  /** Page heading override. Defaults to "Tickets". */
  heading?: string;
  /** Sub-heading override. Defaults to "Support tickets from customers.". */
  description?: string;
  /** Card title override. Defaults to "All Tickets". */
  cardTitle?: string;
  /** Initial Status filter value. Defaults to "All". */
  initialStatusFilter?: TicketStatus | "All";
  /** Initial Waiting On filter value. Defaults to "All". */
  initialWaitingOnFilter?: TicketWaitingOn | "All";
  /**
   * When true, terminal (Completed/Canceled) tickets are excluded from the
   * rendered rows regardless of the active server-side filters, on every
   * (re)fetch and after every in-place row update. Used by the Inbox screen so
   * every row in the queue is actionable. A boolean (not a function) so this
   * component can be driven from a Server Component page wrapper without
   * crossing the server/client boundary with a non-serializable prop.
   */
  excludeTerminal?: boolean;
  /**
   * When true, the fetched ticket list is filtered to rows whose
   * `assignedToId` matches the signed-in agent's identity (`currentAgentId`,
   * the shared `session?.user?.id ?? session?.user?.username` this component
   * also uses to claim), so "who am I" has a single source of truth. Used by
   * the My
   * Assigned screen as an ownership view. Applied on every (re)fetch and after
   * every in-place row update, via the same result-filter mechanism
   * `excludeTerminal` uses. Deliberately does not exclude terminal tickets:
   * `Completed`/`Canceled` tickets I own stay visible (ownership view, not a
   * triage queue). A boolean (not a function) so this component can be driven
   * from a Server Component page wrapper with only serializable props.
   */
  assignedToMe?: boolean;
  /**
   * Empty-state copy shown when the list is empty at the initial filter values
   * (the screen's default view). Defaults to "No tickets found.".
   */
  emptyMessage?: string;
  /**
   * Empty-state copy shown when the filters have been narrowed away from their
   * initial values and nothing matches. Defaults to
   * "No tickets match the selected filters.".
   */
  filteredEmptyMessage?: string;
}

export function TicketListPage({
  heading = "Tickets",
  description = "Support tickets from customers.",
  cardTitle = "All Tickets",
  initialStatusFilter = "All",
  initialWaitingOnFilter = "All",
  excludeTerminal = false,
  assignedToMe = false,
  emptyMessage = "No tickets found.",
  filteredEmptyMessage = "No tickets match the selected filters.",
}: TicketListPageProps = {}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rowPending, setRowPending] = useState<RowPending>(null);
  const [cancelTarget, setCancelTarget] = useState<TicketListItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">(
    initialStatusFilter
  );
  const [waitingOnFilter, setWaitingOnFilter] = useState<TicketWaitingOn | "All">(
    initialWaitingOnFilter
  );

  /**
   * The signed-in agent's identity, resolved once here so "who am I" has a
   * single source of truth shared by both `handleClaim` (who to assign a
   * claimed ticket to) and the `assignedToMe` filter (which tickets I own).
   * `null` when there is no session yet; the `assignedToMe` filter then
   * matches nothing (an unauthenticated view has no tickets of its own).
   */
  const currentAgentId = session?.user?.id ?? session?.user?.username ?? null;

  /**
   * Apply the screen's client-side row filters at the component boundary. Run
   * on every (re)fetch and after every in-place row mutation so, e.g., a ticket
   * cancelled from the Inbox queue drops out immediately. Two independent,
   * composable filters:
   *  - `excludeTerminal`: drop Completed/Canceled rows (Inbox's actionable queue).
   *  - `assignedToMe`: keep only rows I own (My Assigned's ownership view).
   */
  const applyResultFilter = useCallback(
    (rows: TicketListItem[]) => {
      let next = rows;
      if (excludeTerminal) next = next.filter((t) => !isTerminal(t));
      if (assignedToMe) {
        next = next.filter(
          (t) => t.assignedToId !== null && t.assignedToId === currentAgentId
        );
      }
      return next;
    },
    [excludeTerminal, assignedToMe, currentAgentId]
  );

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await crmClient.conversationTickets.list(
        statusFilter,
        waitingOnFilter
      );
      setTickets(applyResultFilter(result));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, waitingOnFilter, applyResultFilter]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  /** Replace a single row from a mutation's response body (no full refetch). */
  function applyRowUpdate(updated: TicketListItem) {
    setTickets((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      return applyResultFilter(next);
    });
  }

  async function runRowMutation(
    id: string,
    action: "claim" | "cancel",
    mutate: () => Promise<TicketListItem>
  ) {
    setRowPending({ id, action });
    setActionError(null);
    try {
      applyRowUpdate(await mutate());
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setRowPending(null);
    }
  }

  function handleClaim(ticket: TicketListItem) {
    void runRowMutation(ticket.id, "claim", () =>
      crmClient.conversationTickets.claim(ticket.id, {
        staffId: currentAgentId ?? "",
        staffName: session?.user?.name ?? "",
        staffEmail: session?.user?.email ?? "",
      })
    );
  }

  function handleCancelConfirmed() {
    const ticket = cancelTarget;
    setCancelTarget(null);
    if (!ticket) return;
    void runRowMutation(ticket.id, "cancel", () =>
      crmClient.conversationTickets.changeStatus(ticket.id, {
        status: "Canceled",
      })
    );
  }

  const isFilterNarrowed =
    statusFilter !== initialStatusFilter ||
    waitingOnFilter !== initialWaitingOnFilter;

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          {heading}
        </h1>
        <p className="text-body-md text-muted-foreground">
          {description}
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-title-lg font-bold flex items-center gap-2">
              <TicketIcon className="w-5 h-5" />
              {cardTitle}
            </CardTitle>
            <div className="flex items-center gap-md">
              <Select
                value={statusFilter}
                onValueChange={(value) =>
                  setStatusFilter(value as TicketStatus | "All")
                }
              >
                <SelectTrigger className="w-[160px]" aria-label="Filter by status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "All" ? "All statuses" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={waitingOnFilter}
                onValueChange={(value) =>
                  setWaitingOnFilter(value as TicketWaitingOn | "All")
                }
              >
                <SelectTrigger
                  className="w-[170px]"
                  aria-label="Filter by waiting on"
                >
                  <SelectValue placeholder="Waiting On" />
                </SelectTrigger>
                <SelectContent>
                  {WAITING_ON_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "All" ? "All (waiting on)" : option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-lg pt-0 space-y-md">
          {actionError && (
            <p className="text-base text-destructive">{actionError}</p>
          )}
          {isLoading ? (
            <TableSkeleton columns={6} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : tickets.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              {isFilterNarrowed ? filteredEmptyMessage : emptyMessage}
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto border border-border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[220px]">Subject</TableHead>
                    <TableHead className="min-w-[120px]">Status</TableHead>
                    <TableHead className="min-w-[120px]">Waiting On</TableHead>
                    <TableHead className="min-w-[180px]">Contact</TableHead>
                    <TableHead className="min-w-[160px]">Assigned To</TableHead>
                    <TableHead className="min-w-[120px]">Created</TableHead>
                    <TableHead className="min-w-[180px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => {
                    const claimBusy =
                      rowPending?.id === ticket.id &&
                      rowPending.action === "claim";
                    const cancelBusy =
                      rowPending?.id === ticket.id &&
                      rowPending.action === "cancel";
                    const rowBusy = rowPending?.id === ticket.id;
                    return (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          router.push(`/conversations/tickets/${ticket.id}`)
                        }
                      >
                        <TableCell className="text-base font-medium">
                          {ticket.subject}
                        </TableCell>
                        <TableCell className="text-base">
                          <Badge variant={STATUS_BADGE_VARIANT[ticket.status]}>
                            {ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-base">
                          <Badge variant="secondary">{ticket.waitingOn}</Badge>
                        </TableCell>
                        <TableCell className="text-base text-muted-foreground">
                          {contactLabel(ticket)}
                        </TableCell>
                        <TableCell className="text-base text-muted-foreground">
                          {assignedLabel(ticket)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-base">
                          {isTerminal(ticket) ? (
                            <span className="text-muted-foreground">
                              {"\u2014"}
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {isClaimable(ticket) && (
                                <Button
                                  size="sm"
                                  aria-label="Claim ticket"
                                  disabled={rowBusy}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleClaim(ticket);
                                  }}
                                >
                                  {claimBusy ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <UserPlus className="w-4 h-4" />
                                  )}
                                  <span className="ml-1">Claim</span>
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                aria-label="Cancel ticket"
                                disabled={rowBusy}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCancelTarget(ticket);
                                }}
                              >
                                {cancelBusy ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <XCircle className="w-4 h-4" />
                                )}
                                <span className="ml-1">Cancel</span>
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
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
            <AlertDialogAction
              variant="destructive"
              onClick={handleCancelConfirmed}
            >
              Cancel Ticket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
