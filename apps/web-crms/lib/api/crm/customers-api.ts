import { request } from "@/lib/api/request";
import {
  Customer,
  CustomerListItem,
  CreateCustomerInput,
  UpdateCustomerStatusInput,
  UpdateCustomerTypeInput,
  UpdateCustomerNotesInput,
  MarketingInteraction,
  OrderHistory,
  PaginatedResponse,
  CustomerIdentityListItem,
  PendingReviewCustomer,
} from "@/types/customer";

export const customerApi = {
  list: (page = 1, pageSize = 20, customerType?: string, search?: string) => {
    let url = `/api/v1/customers?page=${page}&pageSize=${pageSize}`;
    if (customerType) {
      url += `&customerType=${encodeURIComponent(customerType)}`;
    }
    if (search) {
      url += `&searchTerm=${encodeURIComponent(search)}`;
    }
    return request<PaginatedResponse<CustomerListItem>>(url);
  },
  getById: (id: string) =>
    request<Customer>(`/api/v1/customers/${id}`),
  create: (body: CreateCustomerInput) =>
    request<Customer>(`/api/v1/customers`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<void>(`/api/v1/customers/${id}`, {
      method: "DELETE",
    }),
  updateStatus: (id: string, body: UpdateCustomerStatusInput) =>
    request<void>(`/api/v1/customers/${id}/status`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  updateType: (id: string, body: UpdateCustomerTypeInput) =>
    request<void>(`/api/v1/customers/${id}/type`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  updateNotes: (id: string, body: UpdateCustomerNotesInput) =>
    request<void>(`/api/v1/customers/${id}/notes`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  executeRetentionAction: (id: string, body: { riskLevel: string; recommendedAction: string; churnScore: number }) =>
    request<{ ticketId: string; message: string }>(`/api/v1/customers/${id}/retention-action`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

export const customerIdentityApi = {
  listCustomers: () =>
    request<CustomerIdentityListItem[]>(`/api/v1/customer-identity/customers`),
  listPendingReviewCustomers: () =>
    request<PendingReviewCustomer[]>(`/api/v1/customer-identity/pending-review`),
};

export const ordersApi = {
  listByCustomer: (customerId: string) =>
    request<OrderHistory[]>(`/api/v1/customers/${customerId}/orders`),
};

export const marketingInteractionsApi = {
  listByCustomer: (customerId: string, page = 1, pageSize = 10) =>
    request<PaginatedResponse<MarketingInteraction>>(
      `/api/v1/customers/${customerId}/marketing-interactions?page=${page}&pageSize=${pageSize}`
    ),
};
