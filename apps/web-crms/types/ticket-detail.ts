/**
 * Types for the Conversations ticket *detail* screen (Claim / Unclaim /
 * Status transitions — feature 2, backed by #64).
 *
 * Mirrors `TicketDetailDto`, `ClaimTicketDto`, and `ChangeTicketStatusDto`
 * from `apps/api-crms/DTOs/TicketDtos.cs` exactly. Deliberately separate from
 * the legacy `types/ticket.ts` scaffold, which targets a fictional API.
 */
import type {
  TicketStatus,
  TicketWaitingOn,
  TicketSource,
  TicketListContact,
} from "@/types/ticket-list";

export type { TicketStatus, TicketWaitingOn, TicketSource } from "@/types/ticket-list";

export interface TicketDetail {
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
  /**
   * Who cancelled the ticket (e.g. "Customer" or "Super Admin Alice"), for the
   * "{who} cancelled the ticket" attribution shown on a canceled ticket. Null/absent
   * unless the ticket is Canceled. Mirrors TicketDetailDto.CanceledBy.
   */
  canceledBy?: string | null;
}

/** Body for POST /tickets/{id}/claim — all fields required (ClaimTicketDto). */
export interface ClaimTicketInput {
  staffId: string;
  staffName: string;
  staffEmail: string;
}

/** Body for POST /tickets/{id}/status (ChangeTicketStatusDto). */
export interface ChangeTicketStatusInput {
  status: TicketStatus;
}

/** Body for POST /tickets/{id}/waiting-on (SetWaitingOnDto). */
export interface SetWaitingOnInput {
  waitingOn: TicketWaitingOn;
}

/**
 * Body for POST /tickets (CreateTicketDto). Subject is required; contactId is
 * optional (an unlinked ticket, e.g. from a walk-in or an unresolved sender).
 * New tickets start Unclaimed with WaitingOn=None — the server sets those, not
 * the client.
 */
export interface CreateTicketInput {
  subject: string;
  contactId?: string | null;
}
