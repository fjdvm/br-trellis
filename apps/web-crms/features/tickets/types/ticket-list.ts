/**
 * Types for the Conversations "Tickets" list screen.
 *
 * Deliberately separate from the legacy `types/ticket.ts` scaffold, which
 * describes a fictional API contract (pagination wrapper, PUT verbs,
 * assignedToId filter, DELETE cancel) that the real `TicketController`
 * (api-crms) does not implement. This file mirrors `TicketListItemDto`
 * exactly, as verified against `services/api-crms/DTOs/TicketDtos.cs`.
 */

export type TicketStatus = "Unclaimed" | "Claimed" | "Ongoing" | "Completed" | "Canceled";

export type TicketWaitingOn = "Agent" | "Customer" | "None";

/**
 * The channel a ticket originated from. Set once at creation and never changed
 * — a fixed record of origin, distinct from the lifecycle fields. Mirrors the
 * backend `TicketSource` enum. `Ecommerce` is forward-compatible: no ticket
 * takes it yet.
 */
export type TicketSource = "Email" | "Manual" | "Ecommerce";

export interface TicketListContact {
  id: string;
  name: string | null;
  email: string | null;
}

export interface TicketListItem {
  id: string;
  subject: string;
  status: TicketStatus;
  waitingOn: TicketWaitingOn;
  source: TicketSource;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  contactId: string | null;
  contact: TicketListContact | null;
  createdAt: string;
  updatedAt: string;
}
