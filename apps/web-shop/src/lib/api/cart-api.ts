import { apiClient } from "@/lib/api/api-client";
import type { AddCartItemRequest, CartDto, UpdateCartItemRequest } from "@/types/cart";

export const cartApi = {
  getCart: (token: string) =>
    apiClient.get<CartDto>("/cart", { token }),

  addItem: (data: AddCartItemRequest, token: string) =>
    apiClient.post<CartDto>("/cart/items", data, { token }),

  updateItem: (id: string, data: UpdateCartItemRequest, token: string) =>
    apiClient.put<CartDto>(`/cart/items/${id}`, data, { token }),

  removeItem: (id: string, token: string) =>
    apiClient.delete<CartDto>(`/cart/items/${id}`, { token }),

  clearCart: (token: string) =>
    apiClient.delete<void>("/cart", { token }),
};
