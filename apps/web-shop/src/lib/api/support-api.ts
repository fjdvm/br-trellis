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
  }): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const query = params.userId ? `?customerId=${encodeURIComponent(params.userId)}` : "";
      let fullDescription = `Type: ${params.type}\n\n${params.description}`;
      if (params.images && params.images.length > 0) {
        fullDescription += `\n\nAttachments:\n` + params.images.map((img, idx) => `[Image ${idx + 1}] (${img.slice(0, 100)}...)`).join("\n");
      }

      const res = await fetch(`${API_BASE_URL}/tickets${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[${params.type}] ${params.title}`,
          description: fullDescription,
          type: params.type,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, error: text || "Failed to create ticket" };
      }

      const data = await res.json();
      return { success: true, id: data.id };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Network error" };
    }
  },
};
