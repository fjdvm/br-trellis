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

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    conversationTickets: {
      list: jest.fn(),
      claim: jest.fn(),
      changeStatus: jest.fn(),
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

/** The exact prop set the Inbox page wrapper passes to TicketListPage. */
const inboxProps = {
  heading: "Inbox",
  description: "Tickets waiting on an agent's response.",
  cardTitle: "My Queue",
  initialWaitingOnFilter: "Agent" as const,
  resultFilter: (tickets: TicketListItem[]) =>
    tickets.filter(
      (t) => t.status !== "Completed" && t.status !== "Canceled"
    ),
  emptyMessage: "Nothing waiting on you right now.",
  filteredEmptyMessage: "No tickets match the selected filters.",
};

describe("TicketListPage (Inbox props)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
  });

  it("renders the overridden page copy (heading, description, card title)", async () => {
    render(<TicketListPage {...inboxProps} />);

    expect(
      await screen.findByRole("heading", { name: "Inbox" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Tickets waiting on an agent's response.")
    ).toBeInTheDocument();
    expect(screen.getByText("My Queue")).toBeInTheDocument();
  });

  it("performs the initial fetch with WaitingOn=Agent (Status defaults to All)", async () => {
    render(<TicketListPage {...inboxProps} />);

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith(
        "All",
        "Agent"
      )
    );
  });

  it("excludes Completed and Canceled tickets returned by the API via the result filter", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket({ id: "t-open", subject: "Still open", status: "Unclaimed" }),
      makeTicket({
        id: "t-done",
        subject: "All done",
        status: "Completed",
        waitingOn: "Agent",
        assignedToId: "s-9",
      }),
      makeTicket({
        id: "t-cancel",
        subject: "Dropped",
        status: "Canceled",
        waitingOn: "Agent",
        assignedToId: "s-9",
      }),
    ]);

    render(<TicketListPage {...inboxProps} />);

    expect(await screen.findByText("Still open")).toBeInTheDocument();
    expect(screen.queryByText("All done")).not.toBeInTheDocument();
    expect(screen.queryByText("Dropped")).not.toBeInTheDocument();
  });

  it("keeps excluding terminal tickets after the Waiting On filter is changed away from Agent", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket({ id: "t-open", subject: "Still open", status: "Ongoing", assignedToId: "s-1" }),
      makeTicket({
        id: "t-done",
        subject: "All done",
        status: "Completed",
        waitingOn: "Customer",
        assignedToId: "s-9",
      }),
    ]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...inboxProps} />);

    await screen.findByText("Still open");

    // Switch Waiting On away from the Inbox default.
    await user.click(screen.getByLabelText("Filter by waiting on"));
    await user.click(await screen.findByRole("option", { name: "Customer" }));

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith(
        "All",
        "Customer"
      )
    );

    // The Completed ticket is still excluded despite matching the new filter.
    expect(screen.getByText("Still open")).toBeInTheDocument();
    expect(screen.queryByText("All done")).not.toBeInTheDocument();
  });

  it("shows the queue-empty message when nothing matches the default Inbox filter", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);

    render(<TicketListPage {...inboxProps} />);

    expect(
      await screen.findByText("Nothing waiting on you right now.")
    ).toBeInTheDocument();
  });

  it("shows the queue-empty message when only terminal tickets come back (filtered out to nothing at the default filter)", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket({ id: "t-done", subject: "All done", status: "Completed", assignedToId: "s-9" }),
    ]);

    render(<TicketListPage {...inboxProps} />);

    // At the default filter, an empty result after post-filtering is still
    // "your queue is empty", not "you over-filtered".
    expect(
      await screen.findByText("Nothing waiting on you right now.")
    ).toBeInTheDocument();
  });

  it("shows the narrowed empty message once filters are changed away from the Inbox default", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...inboxProps} />);

    await screen.findByText("Nothing waiting on you right now.");

    // Narrow the Status filter beyond the Inbox default.
    await user.click(screen.getByLabelText("Filter by status"));
    await user.click(await screen.findByRole("option", { name: "Ongoing" }));

    await waitFor(() =>
      expect(
        screen.getByText("No tickets match the selected filters.")
      ).toBeInTheDocument()
    );
  });

  it("still supports Claim and row-click navigation through the Inbox props", async () => {
    jest
      .mocked(crmClient.conversationTickets.list)
      .mockResolvedValue([makeTicket({ id: "t-1", status: "Unclaimed" })]);
    jest.mocked(crmClient.conversationTickets.claim).mockResolvedValue(
      makeTicket({
        id: "t-1",
        status: "Claimed",
        assignedToId: "auth|amelia",
        assignedToName: "amelia ward",
      })
    );

    render(<TicketListPage {...inboxProps} />);

    // Claim works and updates in place.
    fireEvent.click(await screen.findByRole("button", { name: "Claim ticket" }));
    await waitFor(() =>
      expect(crmClient.conversationTickets.claim).toHaveBeenCalledWith("t-1", {
        staffId: "auth|amelia",
        staffName: "amelia ward",
        staffEmail: "Amelia.Ward@Trellis.io",
      })
    );
    expect(await screen.findByText("Claimed")).toBeInTheDocument();

    // Row-click navigates to the detail route just like the Tickets screen.
    const row = screen.getByText("Cannot log in").closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(row!);
    expect(mockPush).toHaveBeenCalledWith("/conversations/tickets/t-1");
  });

  it("supports Cancel (with confirmation dialog) through the Inbox props and drops the now-terminal row", async () => {
    jest
      .mocked(crmClient.conversationTickets.list)
      .mockResolvedValue([
        makeTicket({ id: "t-1", status: "Claimed", assignedToId: "s-1" }),
      ]);
    jest
      .mocked(crmClient.conversationTickets.changeStatus)
      .mockResolvedValue(
        makeTicket({ id: "t-1", status: "Canceled", assignedToId: "s-1" })
      );
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...inboxProps} />);

    await user.click(await screen.findByRole("button", { name: "Cancel ticket" }));

    // Dialog gates the call: nothing sent until the user confirms.
    expect(crmClient.conversationTickets.changeStatus).not.toHaveBeenCalled();

    const confirmButtons = screen.getAllByRole("button", {
      name: /Cancel Ticket/i,
    });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(crmClient.conversationTickets.changeStatus).toHaveBeenCalledWith(
        "t-1",
        { status: "Canceled" }
      )
    );

    // In-place update runs through the Inbox resultFilter, so the ticket \u2014
    // now Canceled (terminal) \u2014 is dropped from the queue rather than shown.
    await waitFor(() =>
      expect(screen.queryByText("Cannot log in")).not.toBeInTheDocument()
    );
    // No full-list refetch happened.
    expect(crmClient.conversationTickets.list).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
