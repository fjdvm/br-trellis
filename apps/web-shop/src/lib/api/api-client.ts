const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004/api";

export interface ApiOptions extends RequestInit {
  token?: string;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiError";
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { token, headers: customHeaders, ...customOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(customHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const response = await fetch(url, {
    headers,
    ...customOptions,
  });

  if (!response.ok) {
    let errorData: unknown;
    try {
      errorData = await response.json();
    } catch {
      errorData = null;
    }

    // Surface the method, URL, and any server-provided detail so a failing
    // request is identifiable from the message alone (not just "Bad Request").
    const method = (customOptions.method ?? "GET").toUpperCase();
    const serverDetail =
      errorData && typeof errorData === "object"
        ? ((errorData as { detail?: string; title?: string }).detail ??
           (errorData as { title?: string }).title)
        : undefined;
    const suffix = serverDetail ? ` — ${serverDetail}` : "";

    throw new ApiError(
      response.status,
      `API ${method} ${url} failed: ${response.statusText} (${response.status})${suffix}`,
      errorData
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const apiClient = {
  get: <T>(endpoint: string, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, data?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: unknown, options?: ApiOptions) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: ApiOptions) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};

import type { AddressDto, AuthResponse, UserDto } from "@/types/auth";

export const authApi = {
  register: (data: { fullName: string; email: string; password: string }) =>
    apiClient.post<AuthResponse>("/auth/register", data),

  forgotPassword: (email: string) =>
    apiClient.post<{ message: string }>("/auth/forgot-password", { email }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    apiClient.post<{ message: string }>("/auth/reset-password", data),

  verifyEmail: (token: string) =>
    apiClient.get<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`),
};

export const userApi = {
  getMe: (token: string) =>
    apiClient.get<UserDto>("/users/me", { token }),

  updateMe: (data: { fullName: string; phoneNumber?: string; preferredLanguage?: string }, token: string) =>
    apiClient.put<UserDto>("/users/me", data, { token }),

  changePassword: (data: { currentPassword: string; newPassword: string }, token: string) =>
    apiClient.put<{ message: string }>("/users/me/password", data, { token }),

  getAddresses: (token: string) =>
    apiClient.get<AddressDto[]>("/users/me/addresses", { token }),

  addAddress: (data: Omit<AddressDto, "id">, token: string) =>
    apiClient.post<AddressDto>("/users/me/addresses", data, { token }),

  updateAddress: (id: string, data: Omit<AddressDto, "id">, token: string) =>
    apiClient.put<AddressDto>(`/users/me/addresses/${id}`, data, { token }),

  deleteAddress: (id: string, token: string) =>
    apiClient.delete(`/users/me/addresses/${id}`, { token }),
};

import type { PagedResult, Product, ProductQueryParams } from "@/types/product";

export const productsApi = {
  getProducts: (params?: ProductQueryParams) => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.search) searchParams.append("search", params.search);
    if (params?.sort) searchParams.append("sort", params.sort);
    if (params?.page) searchParams.append("page", params.page.toString());
    if (params?.pageSize) searchParams.append("pageSize", params.pageSize.toString());

    const queryString = searchParams.toString();
    const endpoint = `/products${queryString ? `?${queryString}` : ""}`;
    return apiClient.get<PagedResult<Product>>(endpoint);
  },

  getProduct: (id: string) => apiClient.get<Product>(`/products/${id}`),
};

