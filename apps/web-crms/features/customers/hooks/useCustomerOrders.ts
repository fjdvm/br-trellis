"use client";

import { useState, useEffect, useCallback } from "react";
import { ordersApi } from "@/features/customers/services/customers-api";
import { OrderHistory } from "@/features/customers/types";

export function useCustomerOrders(customerId: string) {
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(customerId));
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!customerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await ordersApi.listByCustomer(customerId);
      setOrders(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order history.");
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (!customerId) return;
    setIsLoading(true);
    let isMounted = true;
    ordersApi.listByCustomer(customerId)
      .then((data) => {
        if (isMounted) {
          setOrders(data || []);
          setError(null);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load order history.");
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [customerId]);

  return {
    orders,
    isLoading,
    error,
    refetch: fetchOrders,
  };
}
