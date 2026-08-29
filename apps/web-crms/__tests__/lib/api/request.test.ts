/**
 * Tests for the shared `request()` client helper's error-body parsing.
 *
 * Focus of #78: controllers that do `return BadRequest(ex.Message)` serialize
 * the body as a raw JSON string (e.g. "Ticket cannot be claimed..."), not a
 * `{ "message": "..." }` object. `request()` must surface the real message for
 * both shapes, and fall back to a generic message for non-JSON bodies.
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

  function mockResponse(init: {
    ok: boolean;
    status: number;
    json: () => Promise<unknown>;
  }): void {
    global.fetch = jest.fn().mockResolvedValue({
      ok: init.ok,
      status: init.status,
      json: init.json,
    } as unknown as Response);
  }

  it("surfaces a raw-string error body directly (BadRequest(ex.Message) shape)", async () => {
    mockResponse({
      ok: false,
      status: 400,
      json: async () =>
        "Ticket cannot be claimed from status 'Claimed' while assigned to another agent.",
    });

    await expect(request("/api/v1/tickets/x/claim", { method: "POST" })).rejects.toThrow(
      "Ticket cannot be claimed from status 'Claimed' while assigned to another agent."
    );
  });

  it("surfaces an object error body's .message (existing ProblemDetails-style shape)", async () => {
    mockResponse({
      ok: false,
      status: 400,
      json: async () => ({ message: "Contact does not exist." }),
    });

    await expect(request("/api/v1/contacts", { method: "POST" })).rejects.toThrow(
      "Contact does not exist."
    );
  });

  it("falls back to a generic status message when the body is not JSON", async () => {
    mockResponse({
      ok: false,
      status: 500,
      json: async () => {
        throw new SyntaxError("Unexpected token < in JSON");
      },
    });

    await expect(request("/api/v1/tickets", {})).rejects.toThrow(
      "API request failed with status 500"
    );
  });

  it("falls back to a generic status message for an object body without a message", async () => {
    mockResponse({
      ok: false,
      status: 400,
      json: async () => ({ errors: { subject: ["Required"] } }),
    });

    await expect(request("/api/v1/tickets", { method: "POST" })).rejects.toThrow(
      "API request failed with status 400"
    );
  });

  it("does not treat an empty string body as a real message", async () => {
    mockResponse({
      ok: false,
      status: 400,
      json: async () => "",
    });

    await expect(request("/api/v1/tickets", { method: "POST" })).rejects.toThrow(
      "API request failed with status 400"
    );
  });
});
