/**
 * Tests for the shared `request()` client helper's error-body parsing.
 *
 * Focus of #78: controllers that do `return BadRequest(ex.Message)` return the
 * body as a bare `text/plain` string (verified live: e.g.
 * "Invalid status transition: 'Ongoing' → 'Claimed'." with
 * Content-Type: text/plain — NOT JSON-quoted). Other endpoints may return a
 * ProblemDetails-style JSON `{ "message": "..." }`. `request()` must surface
 * the real message for a plain-text body, a JSON string body, and a
 * `{ message }` object alike, and fall back to a generic message otherwise.
 *
 * These run in jsdom, so `window` is defined and paths under `/api/v1/` take
 * the browser branch (no server-side auth import).
 */
import { request } from "@/lib/api/request";

describe("request() error body parsing", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.resetAllMocks();
  });

  function mockErrorResponse(status: number, textBody: string): void {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status,
      // The helper reads the body via .text(); mirror the real API which
      // returns bare text/plain for BadRequest(ex.Message).
      text: async () => textBody,
    } as unknown as Response);
  }

  it("surfaces a bare text/plain error body (real BadRequest(ex.Message) shape)", async () => {
    mockErrorResponse(400, "Invalid status transition: 'Ongoing' → 'Claimed'.");

    await expect(request("/api/v1/tickets/x/status", { method: "POST" })).rejects.toThrow(
      "Invalid status transition: 'Ongoing' → 'Claimed'."
    );
  });

  it("surfaces a JSON-quoted string error body", async () => {
    mockErrorResponse(400, JSON.stringify("Ticket cannot be claimed."));

    await expect(request("/api/v1/tickets/x/claim", { method: "POST" })).rejects.toThrow(
      "Ticket cannot be claimed."
    );
  });

  it("surfaces an object error body's .message (ProblemDetails-style shape)", async () => {
    mockErrorResponse(400, JSON.stringify({ message: "Contact does not exist." }));

    await expect(request("/api/v1/contacts", { method: "POST" })).rejects.toThrow(
      "Contact does not exist."
    );
  });

  it("falls back to a generic status message for an object body without a message", async () => {
    mockErrorResponse(400, JSON.stringify({ errors: { subject: ["Required"] } }));

    await expect(request("/api/v1/tickets", { method: "POST" })).rejects.toThrow(
      "API request failed with status 400"
    );
  });

  it("falls back to a generic status message for an empty body", async () => {
    mockErrorResponse(400, "");

    await expect(request("/api/v1/tickets", { method: "POST" })).rejects.toThrow(
      "API request failed with status 400"
    );
  });
});
