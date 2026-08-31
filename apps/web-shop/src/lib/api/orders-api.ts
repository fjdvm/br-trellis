import { apiClient } from "@/lib/api/api-client";
import type { CheckoutSummaryDto, CreateOrderRequest, OrderDto } from "@/types/order";

export const ordersApi = {
  getCheckoutSummary: (token: string) =>
    apiClient.get<CheckoutSummaryDto>("/orders/checkout-summary", { token }),

  createOrder: (data: CreateOrderRequest, token: string) =>
    apiClient.post<OrderDto>("/orders", data, { token }),

  getUserOrders: (token: string) =>
    apiClient.get<OrderDto[]>("/orders", { token }),

  getOrderById: (id: string, token: string) =>
    apiClient.get<OrderDto>(`/orders/${id}`, { token }),
};
