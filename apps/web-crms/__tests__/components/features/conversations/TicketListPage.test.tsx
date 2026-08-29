import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketListPage } from "@/components/features/conversations/TicketListPage";
import { crmClient } from "@/lib/api/crm-client";
import type { TicketListItem } from "@/types/ticket-list";

// Radix Select relies on pointer-capture and scrollIntoView APIs that jsdom
// does not implement. Polyfill them so the dropdown can open under test.
beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    conversationTickets: {
      list: jest.fn(),
    },
  },
}));

function makeTicket(overrides: Partial<TicketListItem> = {}): TicketListItem {
  return {
    id: "t-1",
    subject: "Cannot log in",
    status: "Unclaimed",
    waitingOn: "Agent",
    assignedToId: null,
    assignedToName: null,
    assignedToEmail: null,
    contactId: "c-1",
    contact: { id: "c-1", name: "jane doe", email: "JANE@EXAMPLE.COM" },
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-16T00:00:00Z",
    ...overrides,
  };
}

describe("TicketListPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: resolve to an empty list. Individual tests override as needed.
    // Guarantees no test ever awaits an uninitialised (undefined-returning)
    // mock if it runs in an unexpected order.
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
  });

  it("renders tickets with subject, status, waiting-on, formatted contact, and assignee", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket(),
      makeTicket({
        id: "t-2",
        subject: "Refund request",
        status: "Ongoing",
        waitingOn: "Customer",
        assignedToId: "s-1",
        assignedToName: "amelia agent",
        assignedToEmail: "amelia@support.com",
        contact: null,
        contactId: null,
      }),
    ]);

    render(<TicketListPage />);

    expect(await screen.findByText("Cannot log in")).toBeInTheDocument();
    expect(screen.getByText("Refund request")).toBeInTheDocument();
    // Status badges
    expect(screen.getByText("Unclaimed")).toBeInTheDocument();
    expect(screen.getByText("Ongoing")).toBeInTheDocument();
    // Contact: formatName title-cases, formatEmail lowercases fallback
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    // Assignee formatting + "Unassigned" fallback
    expect(screen.getByText("Amelia Agent")).toBeInTheDocument();
    expect(screen.getByText("Unassigned")).toBeInTheDocument();
  });

  it("falls back to email then dash for contact, and Unassigned for assignee", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket({
        id: "t-email",
        subject: "Email only",
        contact: { id: "c-2", name: null, email: "BOB@EXAMPLE.COM" },
      }),
      makeTicket({
        id: "t-none",
        subject: "No contact",
        contact: null,
        contactId: null,
      }),
    ]);

    render(<TicketListPage />);

    expect(await screen.findByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("\u2014")).toBeInTheDocument();
  });

  it("shows the loading skeleton while fetching", async () => {
    let resolve: (value: TicketListItem[]) => void = () => {};
    jest.mocked(crmClient.conversationTickets.list).mockReturnValue(
      new Promise<TicketListItem[]>((r) => {
        resolve = r;
      })
    );

    render(<TicketListPage />);

    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();

    resolve([]);
    await waitFor(() =>
      expect(screen.queryByTestId("table-skeleton")).not.toBeInTheDocument()
    );
  });

  it("shows an error state when the fetch fails", async () => {
    jest
      .mocked(crmClient.conversationTickets.list)
      .mockRejectedValue(new Error("Boom"));

    render(<TicketListPage />);

    expect(await screen.findByText("Boom")).toBeInTheDocument();
  });

  it("shows the unfiltered empty state when there are no tickets", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);

    render(<TicketListPage />);

    expect(await screen.findByText("No tickets found.")).toBeInTheDocument();
  });

  it("shows the filtered empty state when a filter is active and nothing matches", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage />);

    // Wait for initial load to settle.
    await screen.findByText("No tickets found.");

    // Open the Status filter and pick a value.
    await user.click(screen.getByLabelText("Filter by status"));
    await user.click(await screen.findByRole("option", { name: "Unclaimed" }));

    await waitFor(() =>
      expect(
        screen.getByText("No tickets match the selected filters.")
      ).toBeInTheDocument()
    );
  });

  it("re-fetches with the selected status filter", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage />);

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith("All", "All")
    );

    await user.click(screen.getByLabelText("Filter by status"));
    await user.click(await screen.findByRole("option", { name: "Claimed" }));

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith(
        "Claimed",
        "All"
      )
    );
  });

  it("re-fetches with the selected waiting-on filter", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage />);

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith("All", "All")
    );

    await user.click(screen.getByLabelText("Filter by waiting on"));
    await user.click(await screen.findByRole("option", { name: "Customer" }));

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith(
        "All",
        "Customer"
      )
    );
  });

  it("navigates to the ticket detail route on row click", async () => {
    jest
      .mocked(crmClient.conversationTickets.list)
      .mockResolvedValue([makeTicket({ id: "t-42", subject: "Clickable" })]);

    render(<TicketListPage />);

    const row = (await screen.findByText("Clickable")).closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(row!);

    expect(mockPush).toHaveBeenCalledWith("/conversations/tickets/t-42");
  });
});
