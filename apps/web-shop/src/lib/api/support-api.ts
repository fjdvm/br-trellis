import { apiClient } from "@/lib/api/api-client";
import type { BotReplyResponse, TicketSummary } from "@/types/chat";

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

  async getCustomerTickets(customerId: string): Promise<TicketSummary[]> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : data.items || [];
    } catch {
      return [];
    }
  },

  async getTicketDetails(ticketId: string): Promise<TicketSummary | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/tickets/${ticketId}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
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
