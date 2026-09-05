import { request } from "@/lib/api/request";
import {
  ContactListItem,
  ContactDetail,
  PendingReviewContact as PendingReviewContactType,
} from "@/features/contacts/types";

export const contactsApi = {
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
};
