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
  // Renders draft body content through the real dispatch renderer
  // (EmailBodyRenderer) so previews can never silently diverge from what
  // actually gets sent/displayed.
  renderPreview: (content: string) =>
    request<{ html: string }>(`/api/v1/campaigns/render-preview`, {
      method: "POST",
      body: JSON.stringify({ content }),
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
