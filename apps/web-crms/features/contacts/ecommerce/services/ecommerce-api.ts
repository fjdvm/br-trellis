import { request } from "@/lib/api/request";
import {
  OrderListItem,
  ProductListItem,
  CartListItem,
  EcommerceSyncStatus,
} from "@/features/contacts/ecommerce/types";

export const ecommerceOrdersApi = {
  list: () =>
    request<OrderListItem[]>(`/api/v1/orders`),
};

export const ecommerceProductsApi = {
  list: () =>
    request<ProductListItem[]>(`/api/v1/products`),
};

export const ecommerceCartsApi = {
  list: (status?: string) => {
    let url = `/api/v1/carts`;
    if (status) {
      url += `?status=${encodeURIComponent(status)}`;
    }
    return request<CartListItem[]>(url);
  },
};

export const ecommerceSyncStatusApi = {
  get: () =>
    request<EcommerceSyncStatus>(`/api/v1/ecommerce/sync-status`),
};
