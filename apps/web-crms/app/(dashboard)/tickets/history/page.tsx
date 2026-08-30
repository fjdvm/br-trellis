import { TicketListPage } from "@/components/features/conversations/TicketListPage";

/**
 * History is a team-wide, terminal-only view built on the shared Tickets list:
 * it shows every agent's Completed/Canceled tickets (no assignee scoping,
 * unlike My Assigned). Terminal-only is enforced client-side via `terminalOnly`
 * (symmetric to Triage Queue's `excludeTerminal`), so no non-terminal ticket can
 * ever appear regardless of the filters picked. The Status dropdown is narrowed
 * to All/Completed/Canceled so it can't select a status the view will never
 * show. All props are serializable, so this wrapper stays a Server Component.
 */
export default function Page() {
  return (
    <TicketListPage
      heading="History"
      description="Completed and canceled tickets across the whole team."
      cardTitle="Finished Tickets"
      terminalOnly
      statusOptions={["All", "Completed", "Canceled"]}
      emptyMessage="No finished tickets yet."
      filteredEmptyMessage="No tickets match the selected filters."
    />
  );
}
