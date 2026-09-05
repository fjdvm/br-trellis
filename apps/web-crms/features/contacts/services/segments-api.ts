import { request } from "@/lib/api/request";
import { SegmentListItem, SegmentMember } from "@/features/contacts/types";

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
