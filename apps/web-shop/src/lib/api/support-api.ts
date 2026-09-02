import { apiClient, ApiError } from "@/lib/api/api-client";
import type { BotReplyResponse, TicketSummary } from "@/types/chat";
import type { ConversationDetail, ConversationFetchResult } from "@/lib/support/conversation-access";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

export const supportApi = {
  async getBotReply(userMessage: string, ticketId?: string, token?: string): Promise<BotReplyResponse> {
    return await apiClient.post<BotReplyResponse>(
      "/bot/reply",
      { ticketId: ticketId || "", userMessage },
      { token }
    );
  },

  async getPublicBotReply(userMessage: string): Promise<BotReplyResponse> {
    return await apiClient.post<BotReplyResponse>(
      "/bot/public-reply",
      { userMessage }
    );
  },

  async getCustomerTickets(token?: string): Promise<TicketSummary[]> {
    // Tickets live in api-crms; api-oos exposes the signed-in shopper's tickets at
    // GET /support/tickets (filtered by their account email under the hood). A token
    // is required — without it there's no customer to resolve.
    if (!token) return [];
    try {
      return await apiClient.get<TicketSummary[]>("/support/tickets", { token });
    } catch {
      return [];
    }
  },

  async getTicketDetails(ticketId: string, token?: string): Promise<ConversationFetchResult> {
    // Ownership-verified read (#144): api-oos's GET /support/tickets/{id} returns the
    // Conversation only to its owning Contact; a ticket that doesn't exist and one that
    // isn't the caller's both come back as an identical 404 (ADR 0005), which we map to
    // a single `not-found` outcome. A missing token can't identify a caller → not-found.
    if (!token) return { status: "not-found" };
    try {
      const dto = await apiClient.get<ConversationDetail>(`/support/tickets/${ticketId}`, { token });
      return { status: "ok", conversation: dto };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return { status: "not-found" };
      }
      // Any other failure (network, 5xx) fails closed to not-found rather than leaking.
      return { status: "not-found" };
    }
  },

  async cancelTicket(ticketId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}`, {
        method: "DELETE",
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async createTicket(params: {
    title: string;
    type: string;
    description: string;
    userId?: string;
    images?: string[];
    token?: string;
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    // Support tickets are owned by api-crms; api-oos relays them via its
    // authenticated /support/tickets endpoint (Tickets webhook under the hood).
    // A token is required — the CRM attributes the ticket to the signed-in Contact.
    if (!params.token) {
      return { success: false, error: "Please sign in to submit a support ticket." };
    }

    try {
      let fullDescription = `Type: ${params.type}\n\n${params.description}`;
      if (params.images && params.images.length > 0) {
        fullDescription +=
          `\n\nAttachments:\n` +
          params.images.map((img, idx) => `[Image ${idx + 1}] (${img.slice(0, 100)}...)`).join("\n");
      }

      const data = await apiClient.post<{ ticketId: string }>(
        "/support/tickets",
        { title: params.title, type: params.type, description: fullDescription },
        { token: params.token }
      );
      return { success: true, id: data.ticketId };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create ticket",
      };
    }
  },
};
