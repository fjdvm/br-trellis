import { TicketListPage } from "@/features/conversations/components/ticket-list-page";

/**
 * Triage Queue is a pre-filtered view of the shared Tickets list: it opens on
 * Waiting On = Agent and always hides terminal (Completed/Canceled) tickets,
 * so every row in the queue is actionable. All props are serializable, so this
 * wrapper stays a Server Component.
 */
export default function Page() {
  return (
    <TicketListPage
      heading="Triage Queue"
      description="Tickets waiting on an agent's response."
      cardTitle="My Queue"
      initialStatusFilter="All"
      initialWaitingOnFilter="Agent"
      excludeTerminal
      showSourceFilter={false}
      showNewTicketButton={false}
      emptyMessage="Nothing waiting on you right now."
      filteredEmptyMessage="No tickets match the selected filters."
    />
  );
}
