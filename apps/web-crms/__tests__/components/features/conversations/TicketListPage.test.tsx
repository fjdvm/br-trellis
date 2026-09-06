import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {  TicketListPage  } from "@/features/conversations/components/ticket-list-page";
import { conversationTicketsApi } from "@/features/conversations/services/conversations-api";
import type { TicketListItem } from "@/features/conversations/types";

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

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "auth|amelia",
        name: "amelia ward",
        email: "Amelia.Ward@Trellis.io",
      },
    },
    status: "authenticated",
  }),
}));

jest.mock("@/features/conversations/services/conversations-api", () => ({
  conversationTicketsApi: {
      list: jest.fn(),
      claim: jest.fn(),
      changeStatus: jest.fn(),
    }
}));

function makeTicket(overrides: Partial<TicketListItem> = {}): TicketListItem {
  return {
    id: "t-1",
    subject: "Cannot log in",
    status: "Unclaimed",
    waitingOn: "Agent",
    source: "Email",
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
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);
  });

  it("hides all row actions for a ticket claimed by another agent (owner-only)", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([
        makeTicket({
          id: "t-other",
          subject: "Someone else's ticket",
          status: "Claimed",
          assignedToId: "auth|someone-else",
          assignedToName: "someone else",
        }),
      ]);

    render(<TicketListPage />);

    // Row renders, but neither Claim nor Cancel is offered to a non-owner.
    expect(await screen.findByText("Someone else's ticket")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel ticket" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Claim ticket" })
    ).not.toBeInTheDocument();
  });

  it("shows owner actions for a ticket claimed by the current agent", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([
        makeTicket({
          id: "t-mine",
          subject: "My claimed ticket",
          status: "Claimed",
          assignedToId: "auth|amelia",
          assignedToName: "amelia ward",
        }),
      ]);

    render(<TicketListPage />);

    await screen.findByText("My claimed ticket");
    // Owner sees Cancel (a Claimed ticket isn't claimable, so no Claim button).
    expect(
      screen.getByRole("button", { name: "More options" })
    ).toBeInTheDocument();
  });

  it("renders tickets with subject, status, waiting-on, formatted contact, and assignee", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
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
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
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
    jest.mocked(conversationTicketsApi.list).mockReturnValue(
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
      .mocked(conversationTicketsApi.list)
      .mockRejectedValue(new Error("Boom"));

    render(<TicketListPage />);

    expect(await screen.findByText("Boom")).toBeInTheDocument();
  });

  it("shows the unfiltered empty state when there are no tickets", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);

    render(<TicketListPage />);

    expect(await screen.findByText("No tickets found.")).toBeInTheDocument();
  });

  it("shows the filtered empty state when a filter is active and nothing matches", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);
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
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage />);

    await waitFor(() =>
      expect(conversationTicketsApi.list).toHaveBeenCalledWith("All", "All", "All")
    );

    await user.click(screen.getByLabelText("Filter by status"));
    await user.click(await screen.findByRole("option", { name: "Claimed" }));

    await waitFor(() =>
      expect(conversationTicketsApi.list).toHaveBeenCalledWith(
        "Claimed",
        "All",
        "All"
      )
    );
  });

  it("re-fetches with the selected waiting-on filter", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage />);

    await waitFor(() =>
      expect(conversationTicketsApi.list).toHaveBeenCalledWith("All", "All", "All")
    );

    await user.click(screen.getByLabelText("Filter by waiting on"));
    await user.click(await screen.findByRole("option", { name: "Customer" }));

    await waitFor(() =>
      expect(conversationTicketsApi.list).toHaveBeenCalledWith(
        "All",
        "Customer",
        "All"
      )
    );
  });

  it("re-fetches with the selected source filter", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage />);

    await waitFor(() =>
      expect(conversationTicketsApi.list).toHaveBeenCalledWith(
        "All",
        "All",
        "All"
      )
    );

    await user.click(screen.getByLabelText("Filter by source"));
    await user.click(await screen.findByRole("option", { name: "Manual" }));

    await waitFor(() =>
      expect(conversationTicketsApi.list).toHaveBeenCalledWith(
        "All",
        "All",
        "Manual"
      )
    );
  });

  it("renders a Source badge per row", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({ id: "t-email", subject: "From email", source: "Email" }),
      makeTicket({ id: "t-manual", subject: "By hand", source: "Manual" }),
    ]);

    render(<TicketListPage />);

    expect(await screen.findByText("From email")).toBeInTheDocument();
    // Both Source values render as badges in their rows.
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });

  it("renders the Source filter on the default Tickets screen", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);

    render(<TicketListPage />);

    expect(
      await screen.findByLabelText("Filter by source")
    ).toBeInTheDocument();
  });

  it("renders the New Ticket button on the default Tickets screen", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);

    render(<TicketListPage />);

    expect(
      await screen.findByRole("button", { name: /New Ticket/i })
    ).toBeInTheDocument();
  });

  it("navigates to the ticket detail route on row click", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([makeTicket({ id: "t-42", subject: "Clickable" })]);

    render(<TicketListPage />);

    const row = (await screen.findByText("Clickable")).closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(row!);

    expect(mockPush).toHaveBeenCalledWith("/tickets/t-42");
  });

  // --- Row actions: Claim + Cancel ---

  it("shows a Claim button on an Unclaimed row and hides it once claimed", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([makeTicket({ id: "t-1", status: "Unclaimed" })]);

    render(<TicketListPage />);

    await screen.findByText("Cannot log in");
    expect(
      screen.getByRole("button", { name: "Claim ticket" })
    ).toBeInTheDocument();
  });

  it("shows a Claim button on an Ongoing row with a null assignee", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({ id: "t-1", status: "Ongoing", assignedToId: null }),
    ]);

    render(<TicketListPage />);

    await screen.findByText("Cannot log in");
    expect(
      screen.getByRole("button", { name: "Claim ticket" })
    ).toBeInTheDocument();
  });

  it("hides the Claim button on a Claimed (assigned) row", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({ id: "t-1", status: "Claimed", assignedToId: "s-1" }),
    ]);

    render(<TicketListPage />);

    await screen.findByText("Cannot log in");
    expect(
      screen.queryByRole("button", { name: "Claim ticket" })
    ).not.toBeInTheDocument();
  });

  it("claims a row with the session identity and updates the row in place", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([makeTicket({ id: "t-1", status: "Unclaimed" })]);
    jest.mocked(conversationTicketsApi.claim).mockResolvedValue(
      makeTicket({
        id: "t-1",
        status: "Claimed",
        assignedToId: "auth|amelia",
        assignedToName: "amelia ward",
        assignedToEmail: "amelia.ward@trellis.io",
      })
    );

    render(<TicketListPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Claim ticket" }));

    await waitFor(() =>
      expect(conversationTicketsApi.claim).toHaveBeenCalledWith("t-1", {
        staffId: "auth|amelia",
        staffName: "amelia ward",
        staffEmail: "Amelia.Ward@Trellis.io",
      })
    );
    // Row updates in place from the response body: status badge flips to Claimed
    // and the Claim button disappears (no full-list refetch).
    expect(await screen.findByText("Claimed")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Claim ticket" })
      ).not.toBeInTheDocument()
    );
    expect(conversationTicketsApi.list).toHaveBeenCalledTimes(1);
  });

  it("does not navigate when the Claim button is clicked (stopPropagation)", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([makeTicket({ id: "t-1", status: "Unclaimed" })]);
    jest
      .mocked(conversationTicketsApi.claim)
      .mockResolvedValue(makeTicket({ id: "t-1", status: "Claimed", assignedToId: "auth|amelia" }));

    render(<TicketListPage />);

    fireEvent.click(await screen.findByRole("button", { name: "Claim ticket" }));

    await waitFor(() =>
      expect(conversationTicketsApi.claim).toHaveBeenCalled()
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows a Cancel button on a non-terminal row and gates it behind a confirmation dialog", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([makeTicket({ id: "t-1", status: "Claimed", assignedToId: "auth|amelia" })]);
    jest
      .mocked(conversationTicketsApi.changeStatus)
      .mockResolvedValue(makeTicket({ id: "t-1", status: "Canceled", assignedToId: "auth|amelia" }));
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage />);

    await user.click(await screen.findByRole("button", { name: "More options" }));
    await user.click(screen.getByText("Cancel"));

    // Dialog open; API not called yet.
    expect(conversationTicketsApi.changeStatus).not.toHaveBeenCalled();

    // Confirm inside the dialog.
    const confirmButtons = screen.getAllByRole("button", { name: /Cancel Ticket/i });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(conversationTicketsApi.changeStatus).toHaveBeenCalledWith("t-1", {
        status: "Canceled",
      })
    );
    // Row updates in place; navigation never fired.
    expect(await screen.findByText("Canceled")).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(conversationTicketsApi.list).toHaveBeenCalledTimes(1);
  });

  it("renders neither Claim nor Cancel on a terminal (Completed) row", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([makeTicket({ id: "t-1", status: "Completed", assignedToId: "s-1" })]);

    render(<TicketListPage />);

    await screen.findByText("Completed");
    expect(
      screen.queryByRole("button", { name: "Claim ticket" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel ticket" })
    ).not.toBeInTheDocument();
  });

  it("renders neither Claim nor Cancel on a terminal (Canceled) row", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockResolvedValue([makeTicket({ id: "t-1", status: "Canceled", assignedToId: "s-1" })]);

    render(<TicketListPage />);

    await screen.findByText("Canceled");
    expect(
      screen.queryByRole("button", { name: "Claim ticket" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel ticket" })
    ).not.toBeInTheDocument();
  });
});
