/**
 * Types for the Conversations "Tickets" list screen.
 *
 * Deliberately separate from the legacy `types/ticket.ts` scaffold, which
 * describes a fictional API contract (pagination wrapper, PUT verbs,
 * assignedToId filter, DELETE cancel) that the real `TicketController`
 * (api-crms) does not implement. This file mirrors `TicketListItemDto`
 * exactly, as verified against `apps/api-crms/DTOs/TicketDtos.cs`.
 */

export type TicketStatus = "Unclaimed" | "Claimed" | "Ongoing" | "Completed" | "Canceled";

export type TicketWaitingOn = "Agent" | "Customer" | "None";

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
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToEmail: string | null;
  contactId: string | null;
  contact: TicketListContact | null;
  createdAt: string;
  updatedAt: string;
}
