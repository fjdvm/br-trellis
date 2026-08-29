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
    // Read the body as text first, then try to interpret it as JSON. ASP.NET
    // Core's `BadRequest(ex.Message)` returns a bare `text/plain` string (not
    // even JSON-quoted), while ProblemDetails-style errors return a JSON
    // `{ message: ... }` object. Reading text once and parsing defensively
    // covers a plain-text message, a JSON string, and a JSON object alike.
    try {
      const raw = (await response.text()).trim();
      if (raw.length > 0) {
        let parsed: unknown = undefined;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // Not JSON — treat the raw text as the message.
          parsed = raw;
        }
        if (typeof parsed === "string") {
          if (parsed.trim().length > 0) {
            errorMessage = parsed;
          }
        } else if (
          parsed &&
          typeof parsed === "object" &&
          typeof (parsed as { message?: unknown }).message === "string"
        ) {
          errorMessage = (parsed as { message: string }).message;
        }
      }
    } catch {
      // Ignore body-read errors and fall back to the generic status message.
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json();
}
