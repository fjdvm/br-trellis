import { TicketListPage } from "@/components/features/conversations/TicketListPage";
import type { TicketListItem } from "@/types/ticket-list";

/**
 * Inbox is a pre-filtered view of the shared Tickets list: it opens on
 * Waiting On = Agent and always hides terminal (Completed/Canceled) tickets,
 * so every row in the queue is actionable. Defined at module scope so the
 * reference is stable across renders.
 */
function excludeTerminal(tickets: TicketListItem[]): TicketListItem[] {
  return tickets.filter(
    (ticket) => ticket.status !== "Completed" && ticket.status !== "Canceled"
  );
}

export default function Page() {
  return (
    <TicketListPage
      heading="Inbox"
      description="Tickets waiting on an agent's response."
      cardTitle="My Queue"
      initialWaitingOnFilter="Agent"
      resultFilter={excludeTerminal}
      emptyMessage="Nothing waiting on you right now."
      filteredEmptyMessage="No tickets match the selected filters."
    />
  );
}
