import { TicketListPage } from "@/features/tickets";

/**
 * My Assigned is an ownership view built on the shared Tickets list: it filters
 * client-side to tickets whose `assignedToId` matches the signed-in agent
 * (resolved inside TicketListPage). Unlike Inbox it does NOT exclude terminal
 * tickets — an agent's own Completed/Canceled tickets stay visible. All props
 * are serializable, so this wrapper stays a Server Component.
 */
export default function Page() {
  return (
    <TicketListPage
      heading="My Assigned"
      description="Tickets assigned to you."
      cardTitle="Assigned to Me"
      initialStatusFilter="All"
      assignedToMe
      showSourceFilter={false}
      showNewTicketButton={false}
      emptyMessage="No tickets are assigned to you."
      filteredEmptyMessage="No tickets match the selected filters."
    />
  );
}
