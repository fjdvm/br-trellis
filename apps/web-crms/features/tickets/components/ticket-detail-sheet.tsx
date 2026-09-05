import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useTicket } from "@/features/conversations/hooks/useTicket";
import { crmClient } from "@/lib/api/crm-client";

export function TicketDetailSheet({
  ticketId,
  onClose,
  onRefresh,
  onShowToast,
}: {
  ticketId: string | null;
  onClose: () => void;
  onRefresh?: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const { data: ticket, isLoading } = useTicket(ticketId || "");

  if (!ticketId) return null;

  const handleClaim = async () => {
    try {
      await crmClient.tickets.claim(ticketId);
      onShowToast?.("Ticket claimed successfully.");
      onRefresh?.();
      onClose();
    } catch (err) {
      onShowToast?.("Failed to claim ticket.");
    }
  };

  const handleUnclaim = async () => {
    try {
      await crmClient.tickets.unclaim(ticketId);
      onShowToast?.("Ticket status set to Unclaimed.");
      onRefresh?.();
      onClose();
    } catch (err) {
      onShowToast?.("Failed to unclaim ticket.");
    }
  };

  return (
    <Sheet open={!!ticketId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Ticket Details</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div>Loading ticket details...</div>
        ) : (
          <div className="space-y-4 mt-4">
            <div>{ticket?.title}</div>
            <Button variant="outline" onClick={handleClaim}>Claim Ticket</Button>
            <Button variant="outline" onClick={handleUnclaim}>Unclaim</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
