import { request } from "@/lib/api/request";
import {
  OrderListItem,
  ProductListItem,
  CartListItem,
  WorkflowRunListItem,
  EcommerceSyncStatus,
} from "@/features/ecommerce/types";
import {
  CompanyListItem,
  CompanyDetail,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@/features/contacts/types";
import { SegmentListItem, SegmentMember } from "@/features/contacts/types";
import {
  CannedReplyCategoryListItem,
  CannedReplyCategoryDetail,
  CreateCannedReplyCategoryInput,
  UpdateCannedReplyCategoryInput,
  CannedReplyListItem,
  CannedReplyDetail,
  CreateCannedReplyInput,
  UpdateCannedReplyInput,
} from "@/features/campaigns/types";

export const uploadApi = {
  uploadFile: async (file: File, folder = "general"): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string }>(`/api/v1/upload?folder=${encodeURIComponent(folder)}`, {
      method: "POST",
      body: formData,
    });
  },
};

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

export const workflowRunsApi = {
  list: (entityId?: string) => {
    let url = `/api/v1/workflow-runs`;
    if (entityId) {
      url += `?entityId=${encodeURIComponent(entityId)}`;
    }
    return request<WorkflowRunListItem[]>(url);
  },
};

export const segmentsApi = {
  list: () =>
    request<SegmentListItem[]>(`/api/v1/segments`),
  getMembers: (id: string) =>
    request<SegmentMember[]>(`/api/v1/segments/${id}/members`),
  getAudienceCounts: () =>
    request<{ all: number; contacts: number; companies: number; ecommerce: number }>(
      `/api/v1/segments/audience-counts`
    ),
};

export const companiesApi = {
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
};

export const cannedReplyCategoriesApi = {
  list: (includeArchived = false) =>
    request<CannedReplyCategoryListItem[]>(
      `/api/v1/canned-reply-categories?includeArchived=${includeArchived}`
    ),
  getById: (id: string) =>
    request<CannedReplyCategoryDetail>(`/api/v1/canned-reply-categories/${id}`),
  create: (body: CreateCannedReplyCategoryInput) =>
    request<CannedReplyCategoryDetail>(`/api/v1/canned-reply-categories`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: UpdateCannedReplyCategoryInput) =>
    request<CannedReplyCategoryDetail>(`/api/v1/canned-reply-categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  archive: (id: string) =>
    request<void>(`/api/v1/canned-reply-categories/${id}`, {
      method: "DELETE",
    }),
  restore: (id: string) =>
    request<CannedReplyCategoryDetail>(`/api/v1/canned-reply-categories/${id}/restore`, {
      method: "POST",
    }),
};

export const cannedRepliesApi = {
  list: (includeArchived = false, categoryId?: string) => {
    const params = new URLSearchParams();
    params.set("includeArchived", String(includeArchived));
    if (categoryId) {
      params.set("categoryId", categoryId);
    }
    return request<CannedReplyListItem[]>(
      `/api/v1/canned-replies?${params.toString()}`
    );
  },
  getById: (id: string) =>
    request<CannedReplyDetail>(`/api/v1/canned-replies/${id}`),
  create: (body: CreateCannedReplyInput) =>
    request<CannedReplyDetail>(`/api/v1/canned-replies`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: UpdateCannedReplyInput) =>
    request<CannedReplyDetail>(`/api/v1/canned-replies/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  archive: (id: string) =>
    request<void>(`/api/v1/canned-replies/${id}`, {
      method: "DELETE",
    }),
  restore: (id: string) =>
    request<CannedReplyDetail>(`/api/v1/canned-replies/${id}/restore`, {
      method: "POST",
    }),
};

export const ecommerceSyncStatusApi = {
  get: () =>
    request<EcommerceSyncStatus>(`/api/v1/ecommerce/sync-status`),
};
