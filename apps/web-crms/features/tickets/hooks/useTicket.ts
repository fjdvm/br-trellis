"use client";

import { useState, useEffect, useCallback } from "react";
import { ticketsApi } from "@/features/conversations/inbox/services/conversations-api";
import { LegacyTicket as Ticket } from "../types";

export function useTicket(id: string | null) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(id));
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await ticketsApi.getById(id);
      setTicket(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ticket.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  return { ticket, data: ticket, isLoading, error, refetch: fetchTicket };
}
