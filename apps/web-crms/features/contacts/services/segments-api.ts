import { request } from "@/lib/api/request";
import { SegmentListItem, SegmentMember } from "@/features/contacts/types";

export interface CreateSegmentInput {
  name: string;
  type?: "Static" | "Dynamic";
  rule?: {
    matchMode: string;
    conditions: { field: string; operator: string; value: string }[];
  } | null;
}

export const segmentsApi = {
  list: () =>
    request<SegmentListItem[]>(`/api/v1/segments`),
  getMembers: (id: string) =>
    request<SegmentMember[]>(`/api/v1/segments/${id}/members`),
  getAudienceCounts: () =>
    request<{ all: number; contacts: number; companies: number; ecommerce: number }>(
      `/api/v1/segments/audience-counts`
    ),
  create: (input: CreateSegmentInput) =>
    request<SegmentListItem>(`/api/v1/segments`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (id: string, input: Partial<CreateSegmentInput & { isArchived: boolean }>) =>
    request<SegmentListItem>(`/api/v1/segments/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  delete: (id: string) =>
    request<void>(`/api/v1/segments/${id}`, {
      method: "DELETE",
    }),
};
