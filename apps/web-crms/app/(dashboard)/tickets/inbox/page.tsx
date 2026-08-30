import { TicketListPage } from "@/components/features/conversations/TicketListPage";

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
      initialWaitingOnFilter="Agent"
      excludeTerminal
      showSourceFilter={false}
      emptyMessage="Nothing waiting on you right now."
      filteredEmptyMessage="No tickets match the selected filters."
    />
  );
}
