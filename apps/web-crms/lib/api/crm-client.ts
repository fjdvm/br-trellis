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
import {
  ContactListItem,
  ContactDetail,
  PendingReviewContact as PendingReviewContactType,
} from "@/types/contact";
import { Message } from "@/types/message";
import {
  Campaign,
  CampaignListItem,
  CreateCampaignInput,
  UpdateCampaignInput,
  Template,
  CampaignDispatchResult,
  CampaignEngagementMetrics,
  CampaignAnalytics,
} from "@/types/campaign";
import {
  Ticket,
  TicketListItem,
  CreateTicketInput,
  PaginatedTicketResponse,
} from "@/types/ticket";
import {
  OrderListItem,
  ProductListItem,
  CartListItem,
  WorkflowRunListItem,
} from "@/types/ecommerce";
import {
  CompanyListItem,
  CompanyDetail,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@/types/company";
import { SegmentListItem, SegmentMember } from "@/types/segment";

export const crmClient = {
  customers: {
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
  },
  customerIdentity: {
    listCustomers: () =>
      request<CustomerIdentityListItem[]>(`/api/v1/customer-identity/customers`),
    listPendingReviewCustomers: () =>
      request<PendingReviewCustomer[]>(`/api/v1/customer-identity/pending-review`),
  },
  contacts: {
    list: () =>
      request<ContactListItem[]>(`/api/v1/contacts`),
    getById: (id: string) =>
      request<ContactDetail>(`/api/v1/contacts/${id}`),
    create: (body: { name?: string; email?: string; phone?: string; companyId?: string | null }) =>
      request<ContactDetail>(`/api/v1/contacts`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { name?: string; email?: string; phone?: string; companyId?: string | null }) =>
      request<ContactDetail>(`/api/v1/contacts/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<void>(`/api/v1/contacts/${id}`, {
        method: "DELETE",
      }),
    listPendingReview: () =>
      request<PendingReviewContactType[]>(`/api/v1/contact-identity/pending-review`),
  },
  orders: {
    listByCustomer: (customerId: string) =>
      request<OrderHistory[]>(`/api/v1/customers/${customerId}/orders`),
  },
  marketingInteractions: {
    listByCustomer: (customerId: string, page = 1, pageSize = 10) =>
      request<PaginatedResponse<MarketingInteraction>>(
        `/api/v1/customers/${customerId}/marketing-interactions?page=${page}&pageSize=${pageSize}`
      ),
  },
  campaigns: {
    list: (status?: string) => {
      let url = `/api/v1/campaigns`;
      if (status && status !== "All") {
        url += `?status=${encodeURIComponent(status)}`;
      }
      return request<CampaignListItem[]>(url);
    },
    getEngagementMetrics: (ids: string[]) =>
      request<CampaignEngagementMetrics[]>(`/api/v1/campaigns/metrics?${ids.map((id) => `ids=${encodeURIComponent(id)}`).join("&")}`),
    getAnalytics: (id: string) =>
      request<CampaignAnalytics>(`/api/v1/campaigns/${id}/analytics`),
    getById: (id: string) =>
      request<Campaign>(`/api/v1/campaigns/${id}`),
    create: (body: CreateCampaignInput) =>
      request<Campaign>(`/api/v1/campaigns`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: UpdateCampaignInput) =>
      request<void>(`/api/v1/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    updateStatus: (id: string, status: string) =>
      request<void>(`/api/v1/campaigns/${id}/status?status=${encodeURIComponent(status)}`, {
        method: "PUT",
      }),
    send: (id: string) =>
      request<CampaignDispatchResult>(`/api/v1/campaigns/${id}/send`, {
        method: "POST",
      }),
    delete: (id: string) =>
      request<void>(`/api/v1/campaigns/${id}`, {
        method: "DELETE",
      }),
  },
  templates: {
    list: (channel?: string) => {
      let url = `/api/v1/templates`;
      if (channel) {
        url += `?channel=${encodeURIComponent(channel)}`;
      }
      return request<Template[]>(url);
    },
    getById: (id: string) =>
      request<Template>(`/api/v1/templates/${id}`),
  },
  tickets: {
    list: (page = 1, pageSize = 20, status?: string, assignedToIdOrCustomerId?: string) => {
      let url = `/api/v1/tickets?page=${page}&pageSize=${pageSize}`;
      if (status && status !== "All") {
        url += `&status=${encodeURIComponent(status)}`;
      }
      if (assignedToIdOrCustomerId) {
        url += `&assignedToId=${encodeURIComponent(assignedToIdOrCustomerId)}`;
      }
      return request<PaginatedTicketResponse>(url);
    },
    getById: (id: string) =>
      request<Ticket>(`/api/v1/tickets/${id}`),
    create: (body: CreateTicketInput, customerId: string) =>
      request<Ticket>(`/api/v1/tickets?customerId=${encodeURIComponent(customerId)}`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    claim: (id: string) =>
      request<void>(`/api/v1/tickets/${id}/claim`, {
        method: "PUT",
      }),
    unclaim: (id: string) =>
      request<void>(`/api/v1/tickets/${id}/unclaim`, { method: "PUT" }),
    updateStatus: (id: string, status: string) =>
      request<void>(`/api/v1/tickets/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    cancel: (id: string) =>
      request<void>(`/api/v1/tickets/${id}`, {
        method: "DELETE",
      }),
  },
  messages: {
    listByTicket: (ticketId: string) =>
      request<Message[]>(`/api/v1/tickets/${ticketId}/messages`),
    create: (ticketId: string, senderId: string, content: string) =>
      request<Message>(`/api/v1/tickets/${ticketId}/messages?senderId=${encodeURIComponent(senderId)}`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    markRead: (ticketId: string, messageId: string) =>
      request<void>(`/api/v1/tickets/${ticketId}/messages/${messageId}/read`, {
        method: "PUT",
      }),
  },
  upload: {
    uploadFile: async (file: File, folder = "general"): Promise<{ url: string }> => {
      const formData = new FormData();
      formData.append("file", file);
      return request<{ url: string }>(`/api/v1/upload?folder=${encodeURIComponent(folder)}`, {
        method: "POST",
        body: formData,
      });
    },
  },
  ecommerceOrders: {
    list: () =>
      request<OrderListItem[]>(`/api/v1/orders`),
  },
  ecommerceProducts: {
    list: () =>
      request<ProductListItem[]>(`/api/v1/products`),
  },
  ecommerceCarts: {
    list: (status?: string) => {
      let url = `/api/v1/carts`;
      if (status) {
        url += `?status=${encodeURIComponent(status)}`;
      }
      return request<CartListItem[]>(url);
    },
  },
  workflowRuns: {
    list: (entityId?: string) => {
      let url = `/api/v1/workflow-runs`;
      if (entityId) {
        url += `?entityId=${encodeURIComponent(entityId)}`;
      }
      return request<WorkflowRunListItem[]>(url);
    },
  },
  segments: {
    list: () =>
      request<SegmentListItem[]>(`/api/v1/segments`),
    getMembers: (id: string) =>
      request<SegmentMember[]>(`/api/v1/segments/${id}/members`),
  },
  companies: {
    list: (includeArchived = false) =>
      request<CompanyListItem[]>(`/api/v1/companies?includeArchived=${includeArchived}`),
    getById: (id: string) =>
      request<CompanyDetail>(`/api/v1/companies/${id}`),
    create: (body: CreateCompanyInput) =>
      request<CompanyDetail>(`/api/v1/companies`, {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: UpdateCompanyInput) =>
      request<CompanyDetail>(`/api/v1/companies/${id}`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    archive: (id: string) =>
      request<void>(`/api/v1/companies/${id}`, {
        method: "DELETE",
      }),
  },
};
