"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ticket as TicketIcon } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export function TicketListPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | "All">("All");
  const [waitingOnFilter, setWaitingOnFilter] = useState<TicketWaitingOn | "All">(
    "All"
  );

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await crmClient.conversationTickets.list(
        statusFilter,
        waitingOnFilter
      );
      setTickets(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, waitingOnFilter]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const hasActiveFilter = statusFilter !== "All" || waitingOnFilter !== "All";

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Tickets
        </h1>
        <p className="text-body-md text-muted-foreground">
          Support tickets from customers.
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-title-lg font-bold flex items-center gap-2">
              <TicketIcon className="w-5 h-5" />
              All Tickets
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
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : tickets.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              {hasActiveFilter
                ? "No tickets match the selected filters."
                : "No tickets found."}
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
