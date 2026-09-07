export type LegacyTicketStatus = "Unclaimed" | "Claimed" | "Ongoing" | "Completed" | "Canceled" | string;

export interface LegacyTicketListItem {
  id: string;
  title: string;
  status: LegacyTicketStatus;
  customerName: string;
  unreadMessageCount?: number;
  assignedToName?: string | null;
  createdAt: string;
  updatedAt?: string;
  lastMessageAt?: string | null;
  lastMessageContent?: string | null;
}

export interface LegacyTicket extends LegacyTicketListItem {
  description: string;
  imageUrl?: string | null;
  customerId: string;
  assignedToId?: string | null;
  updatedAt: string;
  category?: string;
  sentiment?: string;
}

export interface LegacyCreateTicketInput {
  title: string;
  description: string;
  imageUrl?: string;
}

export interface PaginatedTicketResponse {
  items: LegacyTicketListItem[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
