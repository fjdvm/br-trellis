import { request } from "@/lib/api/request";
import {
  CompanyListItem,
  CompanyDetail,
  CreateCompanyInput,
  UpdateCompanyInput,
} from "@/features/contacts/types";

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
