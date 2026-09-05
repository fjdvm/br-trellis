// Ticket domain types live in features/conversations since the Conversations
// Inbox and the standalone Tickets page share the same domain model. Re-export
// here so features/tickets consumers have a stable local import path.
export type {
  TicketStatus,
  TicketListItem,
  CreateTicketInput,
  PaginatedTicketResponse,
} from "@/features/conversations/types";

// LegacyTicket is the full ticket detail shape (aliased for backward compat)
export type { LegacyTicket as Ticket } from "@/features/conversations/types";
