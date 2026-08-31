"use client";

import { useState, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ordersApi } from "@/lib/api/orders-api";
import type { CheckoutSummaryDto, CreateOrderRequest, OrderDto } from "@/types/order";

export function useOrders() {
  const { data: session, status } = useSession();
  const token = (session as { accessToken?: string })?.accessToken;
  const isAuthenticated = status === "authenticated" && !!token;

  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [summary, setSummary] = useState<CheckoutSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getUserOrders(token);
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load orders";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await ordersApi.getCheckoutSummary(token);
      setSummary(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to fetch checkout summary";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createOrder = async (request: CreateOrderRequest): Promise<OrderDto> => {
    if (!token) throw new Error("Authentication required");
    setLoading(true);
    setError(null);
    try {
      const order = await ordersApi.createOrder(request, token);
      return order;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError(null);
    ordersApi.getUserOrders(token)
      .then((data) => { if (!cancelled) setOrders(data); })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to load orders";
          setError(msg);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  return {
    orders,
    summary,
    loading,
    error,
    isAuthenticated,
    fetchOrders,
    fetchSummary,
    createOrder,
  };
}
