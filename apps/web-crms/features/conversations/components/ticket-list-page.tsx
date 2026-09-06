"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Ticket as TicketIcon } from "lucide-react";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TicketCancelDialog } from "@/features/conversations/components/ticket-cancel-dialog";
import { TicketFilters } from "@/features/conversations/components/ticket-filters";
import { conversationTicketsApi } from "@/features/conversations/services/conversations-api";
import { useClientPagination } from "@/components/shared/table-pagination";
import { useCurrentAgentId } from "@/hooks/use-current-agent-id";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { NewTicketSheet } from "@/features/conversations/components/new-ticket-sheet";
import { isTerminalStatus } from "@/features/conversations/services/tickets";
import { formatName, formatEmail } from "@/lib/format-display";
import type {
  TicketListItem,
  TicketStatus,
  TicketWaitingOn,
  TicketSource,
} from "@/features/conversations/types";
import { TicketTable, type RowPending } from "./ticket-table";

const STATUS_OPTIONS: readonly (TicketStatus | "All")[] = [
  "All",
  "Unclaimed",
  "Claimed",
  "Ongoing",
  "Completed",
  "Canceled",
];

function isTerminal(ticket: TicketListItem): boolean {
  return isTerminalStatus(ticket.status);
}

export interface TicketListPageProps {
  heading?: string;
  description?: string;
  cardTitle?: string;
  initialStatusFilter?: TicketStatus | "All";
  statusOptions?: readonly (TicketStatus | "All")[];
  initialWaitingOnFilter?: TicketWaitingOn | "All";
  initialSourceFilter?: TicketSource | "All";
  resultFilter?: (ticket: TicketListItem) => boolean;
  excludeTerminal?: boolean;
  terminalOnly?: boolean;
  assignedToMe?: boolean;
  activeFilterBadgeLabel?: string;
  showSourceFilter?: boolean;
  showNewTicketButton?: boolean;
  emptyMessage?: string;
  filteredEmptyMessage?: string;
}

export function TicketListPage({
  heading = "Tickets",
  description = "Support tickets and customer request registry.",
  cardTitle = "Ticket registry",
  initialStatusFilter = "All",
  statusOptions = STATUS_OPTIONS,
  initialWaitingOnFilter = "All",
  initialSourceFilter = "All",
  resultFilter,
  excludeTerminal = false,
  terminalOnly = false,
  assignedToMe = false,
  showSourceFilter = true,
  showNewTicketButton = true,
  emptyMessage = "No tickets found.",
  filteredEmptyMessage = "No tickets match the selected filters.",
}: TicketListPageProps = {}) {
  const router = useRouter();
  const { data: session } = useSession();
  const currentAgentId = useCurrentAgentId();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rowPending, setRowPending] = useState<RowPending>(null);
  const [cancelTarget, setCancelTarget] = useState<TicketListItem | null>(null);
  const [activeChip, setActiveChip] = useState<"All" | "Needs Attention" | "Mine" | "Closed">(
    terminalOnly ? "Closed" : assignedToMe ? "Mine" : "All"
  );
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">(
    initialStatusFilter
  );
  const [waitingOnFilter, setWaitingOnFilter] = useState<TicketWaitingOn | "All">(
    initialWaitingOnFilter
  );
  const [sourceFilter, setSourceFilter] = useState<TicketSource | "All">("All");

  const applyResultFilter = useCallback(
    (rows: TicketListItem[]) => {
      let next = rows;
      if (excludeTerminal) next = next.filter((t) => !isTerminal(t));
      if (terminalOnly) next = next.filter((t) => isTerminal(t));
      if (assignedToMe) {
        next = next.filter((t) => {
          if (!currentAgentId) return false;
          return (
            (t.assignedToId !== null && t.assignedToId === currentAgentId) ||
            (t.assignedToName !== null && t.assignedToName === currentAgentId)
          );
        });
      }
      return next;
    },
    [
      excludeTerminal,
      terminalOnly,
      assignedToMe,
      currentAgentId,
      session?.user?.id,
      session?.user?.name,
      session?.user?.username,
    ]
  );

  const loadTickets = useCallback(async (options?: { background?: boolean }) => {
    if (!options?.background) {
      setIsLoading(true);
    }
    try {
      const result = await conversationTicketsApi.list(
        statusFilter,
        waitingOnFilter,
        sourceFilter
      );
      const filtered = applyResultFilter(result);
      setTickets(filtered);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tickets.");
    } finally {
      if (!options?.background) {
        setIsLoading(false);
      }
    }
  }, [statusFilter, waitingOnFilter, sourceFilter, applyResultFilter]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const refreshInBackground = useCallback(() => {
    void loadTickets({ background: true });
  }, [loadTickets]);
  useRefetchOnFocus(refreshInBackground);

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
      conversationTicketsApi.claim(ticket.id, {
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
      conversationTicketsApi.changeStatus(ticket.id, {
        status: "Canceled",
      })
    );
  }

  const chipFilteredTickets = tickets.filter((t) => {
    if (activeChip === "Needs Attention") {
      const nonTerminalCount = tickets.filter((tk) => !isTerminal(tk)).length;
      return nonTerminalCount > 0 ? !isTerminal(t) : true;
    }
    if (activeChip === "Mine") {
      if (!currentAgentId) return true;
      const isMine = (tk: TicketListItem) =>
        tk.assignedToId === currentAgentId || tk.assignedToName === session?.user?.name;
      const mineCount = tickets.filter(isMine).length;
      return mineCount > 0 ? isMine(t) : true;
    }
    if (activeChip === "Closed") return isTerminal(t);
    return true;
  });

  const isFilterNarrowed =
    statusFilter !== initialStatusFilter ||
    waitingOnFilter !== initialWaitingOnFilter ||
    sourceFilter !== "All";

  const pagination = useClientPagination(chipFilteredTickets);

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            {heading}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {description}
          </p>
        </div>
        {showNewTicketButton && (
          <NewTicketSheet onCreated={() => void loadTickets()} />
        )}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg space-y-md">
          <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-title-lg font-bold flex items-center gap-2">
              <TicketIcon className="w-5 h-5" />
              {cardTitle}
            </CardTitle>
            <TicketFilters
              statusFilter={statusFilter}
              statusOptions={statusOptions}
              onStatusChange={(val) => {
                setStatusFilter(val);
                pagination.setPage(1);
              }}
              waitingOnFilter={waitingOnFilter}
              onWaitingOnChange={(val) => {
                setWaitingOnFilter(val);
                pagination.setPage(1);
              }}
              sourceFilter={sourceFilter}
              onSourceChange={(val) => {
                setSourceFilter(val);
                pagination.setPage(1);
              }}
              showSourceFilter={showSourceFilter}
            />
          </div>

          {/* Primary Filter Chips: All | Needs Attention (default) | Mine | Closed */}
          <div className="flex flex-wrap items-center gap-xs pt-xs border-t border-border/60">
            {(["All", "Needs Attention", "Mine", "Closed"] as const).map((chip) => {
              const isActive = activeChip === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => {
                    setActiveChip(chip);
                    pagination.setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {chip === "Needs Attention" ? "Needs Attention (default)" : chip}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="p-lg pt-0 space-y-md">
          {actionError && (
            <p className="text-base text-destructive">{actionError}</p>
          )}
          {isLoading ? (
            <TableSkeleton columns={7} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : tickets.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              {isFilterNarrowed ? filteredEmptyMessage : emptyMessage}
            </div>
          ) : (
            <TicketTable
              pagination={pagination}
              rowPending={rowPending}
              currentAgentId={currentAgentId}
              onClaim={handleClaim}
              onCancelClick={(t) => setCancelTarget(t)}
            />
          )}
        </CardContent>
      </Card>

      <TicketCancelDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
        onConfirm={handleCancelConfirmed}
      />
    </div>
  );
}
