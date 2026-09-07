"use client";

import { useState, useEffect, useCallback } from "react";
import { ticketsApi } from "@/features/conversations/inbox/services/conversations-api";
import { LegacyTicketListItem as TicketListItem, PaginatedTicketResponse } from "../types";

export function useTickets(
  page = 1,
  pageSize = 20,
  status?: string,
  assignedToIdOrCustomerId?: string
) {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [data, setData] = useState<PaginatedTicketResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await ticketsApi.list(page, pageSize, status, assignedToIdOrCustomerId);
      setTickets(res.items);
      setTotalCount(res.totalCount);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets.");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, status, assignedToIdOrCustomerId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, totalCount, data, isLoading, error, refetch: fetchTickets };
}
