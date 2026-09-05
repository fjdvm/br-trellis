"use client";

import { useRouter } from "next/navigation";
import { Ticket as TicketIcon, Loader2, UserPlus, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import { TablePagination, type ClientPagination } from "@/components/shared/TablePagination";
import { STATUS_BADGE_VARIANT, SOURCE_BADGE_VARIANT, isTerminalStatus } from "@/lib/tickets";
import { formatName, formatEmail } from "@/lib/format-display";
import type { TicketListItem } from "@/types/ticket-list";

export type RowPending = { id: string; action: "claim" | "cancel" } | null;

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

function isClaimable(ticket: TicketListItem): boolean {
  return (
    ticket.status === "Unclaimed" ||
    (ticket.status === "Ongoing" && ticket.assignedToId === null)
  );
}

function isTerminal(ticket: TicketListItem): boolean {
  return isTerminalStatus(ticket.status);
}

function canActOnTicket(
  ticket: TicketListItem,
  currentAgentId: string | null
): boolean {
  if (ticket.assignedToId == null) return true;
  return currentAgentId != null && ticket.assignedToId === currentAgentId;
}

interface TicketTableProps {
  pagination: ClientPagination<TicketListItem>;
  rowPending: RowPending;
  currentAgentId: string | null;
  onClaim: (ticket: TicketListItem) => void;
  onCancelClick: (ticket: TicketListItem) => void;
}

export function TicketTable({
  pagination,
  rowPending,
  currentAgentId,
  onClaim,
  onCancelClick,
}: TicketTableProps) {
  const router = useRouter();

  return (
    <>
      <ScrollableTable>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="min-w-[220px]">Subject</TableHead>
              <TableHead className="min-w-[120px]">Status</TableHead>
              <TableHead className="min-w-[120px]">Waiting On</TableHead>
              <TableHead className="min-w-[110px]">Source</TableHead>
              <TableHead className="min-w-[180px]">Contact</TableHead>
              <TableHead className="min-w-[160px]">Assigned To</TableHead>
              <TableHead className="min-w-[120px]">Created</TableHead>
              <TableHead className="min-w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.pageItems.map((ticket) => {
              const claimBusy =
                rowPending !== null &&
                rowPending.id === ticket.id &&
                rowPending.action === "claim";
              const cancelBusy =
                rowPending !== null &&
                rowPending.id === ticket.id &&
                rowPending.action === "cancel";
              const rowBusy = rowPending?.id === ticket.id;
              return (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/tickets/${ticket.id}`)}
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
                  <TableCell className="text-base">
                    <Badge variant={SOURCE_BADGE_VARIANT[ticket.source]}>
                      {ticket.source}
                    </Badge>
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
                      <span className="text-muted-foreground">{"\u2014"}</span>
                    ) : !canActOnTicket(ticket, currentAgentId) ? (
                      <span className="text-muted-foreground">{"\u2014"}</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        {isClaimable(ticket) && (
                          <Button
                            size="sm"
                            aria-label="Claim ticket"
                            disabled={rowBusy}
                            onClick={(e) => {
                              e.stopPropagation();
                              onClaim(ticket);
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
                            onCancelClick(ticket);
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
      </ScrollableTable>
      <TablePagination pagination={pagination} itemLabel="tickets" />
    </>
  );
}
