/**
 * @jest-environment node
 */
jest.mock("@/auth", () => ({
  auth: jest.fn().mockResolvedValue(null),
}));

import { crmClient } from "@/lib/api/crm-client";

const BASE = "https://localhost:5005";

beforeEach(() => {
  jest.resetAllMocks();
});

function mockFetch(status: number, body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(body),
    // request() reads non-OK bodies via response.text() before parsing, so the
    // mock must expose text() too (JSON-serialising object bodies to match how
    // a real fetch Response would return the raw payload as text).
    text: jest
      .fn()
      .mockResolvedValue(typeof body === "string" ? body : JSON.stringify(body)),
  } as unknown as Response);
}

describe("crmClient.customers.list", () => {
  it("calls the correct URL with default pagination", async () => {
    mockFetch(200, { items: [], totalCount: 0, totalPages: 1 });
    await crmClient.customers.list();
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customers?page=1&pageSize=20`,
      expect.objectContaining({
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
      })
    );
  });

  it("calls the correct URL with custom pagination", async () => {
    mockFetch(200, { items: [], totalCount: 0, totalPages: 3 });
    await crmClient.customers.list(2, 10);
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customers?page=2&pageSize=10`,
      expect.any(Object)
    );
  });

  it("returns parsed response data", async () => {
    const mockData = {
      items: [{ id: "1", displayName: "Alice" }],
      totalCount: 1,
      totalPages: 1,
    };
    mockFetch(200, mockData);
    const result = await crmClient.customers.list();
    expect(result).toEqual(mockData);
  });

  it("throws the error message from the response body", async () => {
    mockFetch(500, { message: "Internal server error" });
    await expect(crmClient.customers.list()).rejects.toThrow("Internal server error");
  });

  it("throws a generic error when response body has no message", async () => {
    mockFetch(404, {});
    await expect(crmClient.customers.list()).rejects.toThrow(
      "API request failed with status 404"
    );
  });
});

describe("crmClient.customers.getById", () => {
  it("calls the correct URL", async () => {
    mockFetch(200, { id: "abc123" });
    await crmClient.customers.getById("abc123");
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customers/abc123`,
      expect.any(Object)
    );
  });
});

describe("crmClient.customers.create", () => {
  it("sends a POST request with JSON body", async () => {
    const input = {
      firstName: "Bob",
      lastName: "Smith",
      email: "bob@example.com",
      customerType: "Regular" as const,
    };
    mockFetch(201, { id: "new-id", ...input });
    await crmClient.customers.create(input);
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customers`,
      expect.objectContaining({ method: "POST", body: JSON.stringify(input) })
    );
  });
});

describe("crmClient.customers.delete", () => {
  it("sends a DELETE request and handles 204 no-content", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: jest.fn(),
    } as unknown as Response);
    const result = await crmClient.customers.delete("abc123");
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customers/abc123`,
      expect.objectContaining({ method: "DELETE" })
    );
    expect(result).toBeUndefined();
  });
});

describe("crmClient.customers.updateStatus", () => {
  it("sends a PUT request with status body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: jest.fn(),
    } as unknown as Response);
    await crmClient.customers.updateStatus("abc123", { status: "Inactive" });
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customers/abc123/status`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ status: "Inactive" }),
      })
    );
  });
});

describe("crmClient.customers.updateType", () => {
  it("sends a PUT request with customerType body", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: jest.fn(),
    } as unknown as Response);
    await crmClient.customers.updateType("abc123", { customerType: "InstitutionalBuyer" });
    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customers/abc123/type`,
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ customerType: "InstitutionalBuyer" }),
      })
    );
  });
});

describe("crmClient.customerIdentity.listCustomers", () => {
  it("calls the versioned customer identity customer-list endpoint", async () => {
    mockFetch(200, []);

    await crmClient.customerIdentity.listCustomers();

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customer-identity/customers`,
      expect.any(Object)
    );
  });
});

describe("crmClient.customerIdentity.listPendingReviewCustomers", () => {
  it("calls the versioned pending-review endpoint", async () => {
    mockFetch(200, []);

    await crmClient.customerIdentity.listPendingReviewCustomers();

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/customer-identity/pending-review`,
      expect.any(Object)
    );
  });
});

describe("crmClient.conversationTickets.setWaitingOn", () => {
  it("sends a POST request to the waiting-on endpoint with the waitingOn body", async () => {
    mockFetch(200, { id: "t-1", waitingOn: "Agent" });

    await crmClient.conversationTickets.setWaitingOn("t-1", {
      waitingOn: "Agent",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/tickets/t-1/waiting-on`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ waitingOn: "Agent" }),
      })
    );
  });

  it("returns the updated ticket from the response body", async () => {
    const updated = { id: "t-1", waitingOn: "Customer" };
    mockFetch(200, updated);

    const result = await crmClient.conversationTickets.setWaitingOn("t-1", {
      waitingOn: "Customer",
    });

    expect(result).toEqual(updated);
  });

  it("throws the real backend error message when the change is rejected", async () => {
    // request() reads non-OK bodies via response.text() (ASP.NET Core's
    // BadRequest(ex.Message) returns a bare text/plain string).
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue("Invalid WaitingOn: 'Nobody'."),
    } as unknown as Response);

    await expect(
      crmClient.conversationTickets.setWaitingOn("t-1", { waitingOn: "None" })
    ).rejects.toThrow("Invalid WaitingOn: 'Nobody'.");
  });
});

describe("crmClient.conversationMessages.listByTicket", () => {
  it("sends a GET request to the ticket messages endpoint", async () => {
    mockFetch(200, []);

    await crmClient.conversationMessages.listByTicket("t-1");

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/tickets/t-1/messages`,
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("returns the parsed message array from the response body", async () => {
    const messages = [
      {
        id: "m-1",
        ticketId: "t-1",
        senderType: "Contact",
        senderContactId: "c-1",
        senderStaffId: null,
        senderStaffName: null,
        content: "Hello",
        sentAt: "2025-01-15T00:00:00Z",
      },
    ];
    mockFetch(200, messages);

    const result = await crmClient.conversationMessages.listByTicket("t-1");

    expect(result).toEqual(messages);
  });
});

describe("crmClient.conversationMessages.postStaffMessage", () => {
  it("sends a POST to the messages endpoint with senderType Staff fixed", async () => {
    mockFetch(201, {
      id: "m-1",
      ticketId: "t-1",
      senderType: "Staff",
      senderContactId: null,
      senderStaffId: "auth|amelia",
      senderStaffName: "amelia ward",
      content: "On it",
      sentAt: "2025-01-15T10:00:00Z",
    });

    await crmClient.conversationMessages.postStaffMessage("t-1", {
      senderStaffId: "auth|amelia",
      senderStaffName: "amelia ward",
      content: "On it",
    });

    expect(fetch).toHaveBeenCalledWith(
      `${BASE}/api/v1/tickets/t-1/messages`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          senderType: "Staff",
          senderStaffId: "auth|amelia",
          senderStaffName: "amelia ward",
          content: "On it",
        }),
      })
    );
  });

  it("returns the created message from the response body", async () => {
    const created = {
      id: "m-1",
      ticketId: "t-1",
      senderType: "Staff",
      senderContactId: null,
      senderStaffId: "auth|amelia",
      senderStaffName: "amelia ward",
      content: "On it",
      sentAt: "2025-01-15T10:00:00Z",
    };
    mockFetch(201, created);

    const result = await crmClient.conversationMessages.postStaffMessage("t-1", {
      senderStaffId: "auth|amelia",
      senderStaffName: "amelia ward",
      content: "On it",
    });

    expect(result).toEqual(created);
  });

  it("throws the real backend error message when the post is rejected", async () => {
    // ASP.NET Core's BadRequest(ex.Message) returns a bare text/plain string.
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: jest.fn().mockResolvedValue("Message content cannot be empty."),
    } as unknown as Response);

    await expect(
      crmClient.conversationMessages.postStaffMessage("t-1", {
        senderStaffId: "auth|amelia",
        senderStaffName: "amelia ward",
        content: "   ",
      })
    ).rejects.toThrow("Message content cannot be empty.");
  });
});
