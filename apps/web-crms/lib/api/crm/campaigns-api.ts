import { request } from "@/lib/api/request";
import {
  Campaign,
  CampaignListItem,
  CreateCampaignInput,
  UpdateCampaignInput,
  Template,
  CampaignDispatchResult,
  CampaignEngagementMetrics,
  CampaignAnalytics,
} from "@/features/campaigns/types";

export const campaignsApi = {
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
};

export const templatesApi = {
  list: (channel?: string) => {
    let url = `/api/v1/templates`;
    if (channel) {
      url += `?channel=${encodeURIComponent(channel)}`;
    }
    return request<Template[]>(url);
  },
  getById: (id: string) =>
    request<Template>(`/api/v1/templates/${id}`),
};

export const blockTemplatesApi = {
  list: (channel?: string) => {
    let url = `/api/v1/block-templates`;
    if (channel) {
      url += `?channel=${encodeURIComponent(channel)}`;
    }
    return request<import("@/types/block-template").BlockTemplate[]>(url);
  },
  getById: (id: string) =>
    request<import("@/types/block-template").BlockTemplate>(`/api/v1/block-templates/${id}`),
  create: (body: import("@/types/block-template").CreateBlockTemplateInput) =>
    request<import("@/types/block-template").BlockTemplate>(`/api/v1/block-templates`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: import("@/types/block-template").CreateBlockTemplateInput) =>
    request<import("@/types/block-template").BlockTemplate>(`/api/v1/block-templates/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: (id: string) =>
    request<void>(`/api/v1/block-templates/${id}`, {
      method: "DELETE",
    }),
};
