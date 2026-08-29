const CRM_BASE = process.env.NEXT_PUBLIC_CRM_API_URL ?? "https://localhost:5005";

function getBaseUrl(path: string): string {
  if (typeof window !== "undefined" && path.startsWith("/api/v1/")) {
    return "";
  }

  return CRM_BASE;
}

function rewritePath(path: string): string {
  if (typeof window !== "undefined" && path.startsWith("/api/v1/")) {
    return "/api/crm/" + path.slice("/api/v1/".length);
  }

  return path;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl(path)}${rewritePath(path)}`;
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };

  if (!(init?.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (typeof window === "undefined") {
    const { getAccessToken } = await import("@/lib/api/session");
    const token = await getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, { ...init, headers });

  if (!response.ok) {
    let errorMessage = `API request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      // ASP.NET Core's `BadRequest(ex.Message)` serializes the body as a raw
      // JSON string, whereas ProblemDetails-style errors use `{ message: ... }`.
      // Handle both, ignoring empty strings and shapes without a usable message.
      if (typeof errorData === "string") {
        if (errorData.trim().length > 0) {
          errorMessage = errorData;
        }
      } else if (errorData?.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parse errors for non-JSON responses.
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}
