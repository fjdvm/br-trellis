"use client";

import { useState, useEffect, useCallback } from "react";
import { crmClient } from "@/lib/api/crm-client";
import { TicketListItem, PaginatedTicketResponse } from "@/types/ticket";

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
      const res = await crmClient.tickets.list(page, pageSize, status, assignedToIdOrCustomerId);
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

  return {
    tickets,
    totalCount,
    data,
    isLoading,
    error,
    refetch: fetchTickets,
    setTickets,
  };
}
