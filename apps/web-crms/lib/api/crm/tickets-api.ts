import { request } from "@/lib/api/request";
import { Message } from "@/types/message";
import {
  ConversationMessage,
  PostStaffMessageInput,
} from "@/types/conversation-message";
import {
  Ticket,
  CreateTicketInput,
  PaginatedTicketResponse,
} from "@/types/ticket";
import { TicketListItem as ConversationTicketListItem } from "@/types/ticket-list";
import {
  TicketDetail,
  ClaimTicketInput,
  ChangeTicketStatusInput,
  SetWaitingOnInput,
  CreateTicketInput as CreateConversationTicketInput,
} from "@/types/ticket-detail";

export const ticketsApi = {
  list: (page = 1, pageSize = 20, status?: string, assignedToIdOrCustomerId?: string) => {
    let url = `/api/v1/tickets?page=${page}&pageSize=${pageSize}`;
    if (status && status !== "All") {
      url += `&status=${encodeURIComponent(status)}`;
    }
    if (assignedToIdOrCustomerId) {
      url += `&assignedToId=${encodeURIComponent(assignedToIdOrCustomerId)}`;
    }
    return request<PaginatedTicketResponse>(url);
  },
  getById: (id: string) =>
    request<Ticket>(`/api/v1/tickets/${id}`),
  create: (body: CreateTicketInput, customerId: string) =>
    request<Ticket>(`/api/v1/tickets?customerId=${encodeURIComponent(customerId)}`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  claim: (id: string) =>
    request<void>(`/api/v1/tickets/${id}/claim`, {
      method: "PUT",
    }),
  unclaim: (id: string) =>
    request<void>(`/api/v1/tickets/${id}/unclaim`, { method: "PUT" }),
  updateStatus: (id: string, status: string) =>
    request<void>(`/api/v1/tickets/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
  cancel: (id: string) =>
    request<void>(`/api/v1/tickets/${id}`, {
      method: "DELETE",
    }),
};

export const conversationTicketsApi = {
  list: (status?: string, waitingOn?: string, source?: string) => {
    const params = new URLSearchParams();
    if (status && status !== "All") {
      params.set("status", status);
    }
    if (waitingOn && waitingOn !== "All") {
      params.set("waitingOn", waitingOn);
    }
    if (source && source !== "All") {
      params.set("source", source);
    }
    const query = params.toString();
    return request<ConversationTicketListItem[]>(
      `/api/v1/tickets${query ? `?${query}` : ""}`
    );
  },
  getById: (id: string) =>
    request<TicketDetail>(`/api/v1/tickets/${id}`),
  create: (body: CreateConversationTicketInput) =>
    request<TicketDetail>(`/api/v1/tickets`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  claim: (id: string, body: ClaimTicketInput) =>
    request<TicketDetail>(`/api/v1/tickets/${id}/claim`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  unclaim: (id: string) =>
    request<TicketDetail>(`/api/v1/tickets/${id}/unclaim`, {
      method: "POST",
    }),
  changeStatus: (id: string, body: ChangeTicketStatusInput) =>
    request<TicketDetail>(`/api/v1/tickets/${id}/status`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  setWaitingOn: (id: string, body: SetWaitingOnInput) =>
    request<TicketDetail>(`/api/v1/tickets/${id}/waiting-on`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const conversationMessagesApi = {
  listByTicket: (ticketId: string) =>
    request<ConversationMessage[]>(`/api/v1/tickets/${ticketId}/messages`),
  postStaffMessage: (ticketId: string, body: PostStaffMessageInput) =>
    request<ConversationMessage>(`/api/v1/tickets/${ticketId}/messages`, {
      method: "POST",
      body: JSON.stringify({ senderType: "Staff", ...body }),
    }),
};

export const messagesApi = {
  listByTicket: (ticketId: string) =>
    request<Message[]>(`/api/v1/tickets/${ticketId}/messages`),
  create: (ticketId: string, senderId: string, content: string) =>
    request<Message>(`/api/v1/tickets/${ticketId}/messages?senderId=${encodeURIComponent(senderId)}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
  markRead: (ticketId: string, messageId: string) =>
    request<void>(`/api/v1/tickets/${ticketId}/messages/${messageId}/read`, {
      method: "PUT",
    }),
};
