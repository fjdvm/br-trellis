import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatName, formatEmail } from "@/lib/format-display";
import type { TicketDetail, TicketWaitingOn } from "@/features/tickets";

const WAITING_ON_OPTIONS: TicketWaitingOn[] = ["Agent", "Customer", "None"];

interface TicketDetailsSidebarProps {
  ticket: TicketDetail;
  pending: string | null;
  isTerminal: boolean;
  onSetWaitingOn: (value: TicketWaitingOn) => void;
}

export function TicketDetailsSidebar({
  ticket,
  pending,
  isTerminal,
  onSetWaitingOn,
}: TicketDetailsSidebarProps) {
  return (
    <aside data-testid="details-sidebar" className="min-w-0">
      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Details</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0 space-y-md">
          <div className="grid grid-cols-2 gap-md text-base items-center">
            <div className="text-muted-foreground">Waiting On</div>
            <div className="min-w-0">
              <Select
                value={ticket.waitingOn}
                onValueChange={(value) => onSetWaitingOn(value as TicketWaitingOn)}
                disabled={pending === "waitingOn" || isTerminal}
              >
                <SelectTrigger className="w-full max-w-[200px]" aria-label="Set waiting on">
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
            <div className="min-w-0 break-words">{formatName(ticket.assignedToName) ?? "\u2014"}</div>
            <div className="text-muted-foreground">Assignee email</div>
            <div className="min-w-0 break-words">{formatEmail(ticket.assignedToEmail) ?? "\u2014"}</div>
          </div>

          {ticket.contact && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-md text-base">
                <div className="text-muted-foreground">Contact</div>
                <div className="min-w-0 break-words">{formatName(ticket.contact.name) ?? "\u2014"}</div>
                <div className="text-muted-foreground">Contact email</div>
                <div className="min-w-0 break-words">{formatEmail(ticket.contact.email) ?? "\u2014"}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
