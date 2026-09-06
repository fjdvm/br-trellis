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

// A mutable session object so individual tests can control the signed-in
// identity (e.g. drop `id` to exercise the username fallback) — the same
// identity source `handleClaim` uses (`session?.user?.id ?? session?.user?.username`).
type MockUser = {
  id?: string;
  username?: string;
  name?: string;
  email?: string;
};
let mockUser: MockUser = {
  id: "auth|amelia",
  username: "amelia",
  name: "amelia ward",
  email: "Amelia.Ward@Trellis.io",
};

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: mockUser },
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
    status: "Ongoing",
    waitingOn: "Agent",
    source: "Email",
    assignedToId: "auth|amelia",
    assignedToName: "amelia ward",
    assignedToEmail: "amelia.ward@trellis.io",
    contactId: "c-1",
    contact: { id: "c-1", name: "jane doe", email: "JANE@EXAMPLE.COM" },
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-16T00:00:00Z",
    ...overrides,
  };
}

/** The exact prop set the My Assigned page wrapper passes to TicketListPage. */
const assignedProps = {
  heading: "My Assigned",
  description: "Tickets assigned to you.",
  cardTitle: "Assigned to Me",
  assignedToMe: true,
  showSourceFilter: false,
  showNewTicketButton: false,
  emptyMessage: "No tickets are assigned to you.",
  filteredEmptyMessage: "No tickets match the selected filters.",
};

describe("TicketListPage (My Assigned props)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to a fully-populated identity for each test.
    mockUser = {
      id: "auth|amelia",
      username: "amelia",
      name: "amelia ward",
      email: "Amelia.Ward@Trellis.io",
    };
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);
  });

  it("renders the overridden page copy (heading, description, card title)", async () => {
    render(<TicketListPage {...assignedProps} />);

    expect(
      await screen.findByRole("heading", { name: "My Assigned" })
    ).toBeInTheDocument();
    expect(screen.getByText("Tickets assigned to you.")).toBeInTheDocument();
    expect(screen.getByText("Assigned to Me")).toBeInTheDocument();
  });

  it("does not render the Source filter (My Assigned stays as it was)", async () => {
    render(<TicketListPage {...assignedProps} />);

    await screen.findByRole("heading", { name: "My Assigned" });
    expect(
      screen.queryByRole("tablist", { name: "Filter by source" })
    ).not.toBeInTheDocument();
  });

  it("does not render the New Ticket button (My Assigned is a worklist)", async () => {
    render(<TicketListPage {...assignedProps} />);

    await screen.findByRole("heading", { name: "My Assigned" });
    expect(
      screen.queryByRole("button", { name: /New Ticket/i })
    ).not.toBeInTheDocument();
  });

  it("performs the initial fetch with Unclaimed/All (no server-side assignee filter)", async () => {
    render(<TicketListPage {...assignedProps} />);

    await waitFor(() =>
      expect(conversationTicketsApi.list).toHaveBeenCalledWith(
        "Unclaimed",
        "All",
        "All"
      )
    );
  });

  it("renders only tickets whose assignedToId matches the session id", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({ id: "t-mine", subject: "Mine", assignedToId: "auth|amelia" }),
      makeTicket({
        id: "t-theirs",
        subject: "Theirs",
        assignedToId: "auth|bob",
      }),
    ]);

    render(<TicketListPage {...assignedProps} />);

    expect(await screen.findByText("Mine")).toBeInTheDocument();
    expect(screen.queryByText("Theirs")).not.toBeInTheDocument();
  });

  it("excludes tickets assigned to a different agent and unassigned tickets", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({ id: "t-mine", subject: "Mine", assignedToId: "auth|amelia" }),
      makeTicket({
        id: "t-theirs",
        subject: "Theirs",
        assignedToId: "auth|bob",
      }),
      makeTicket({
        id: "t-none",
        subject: "Nobody's",
        status: "Unclaimed",
        assignedToId: null,
        assignedToName: null,
      }),
    ]);

    render(<TicketListPage {...assignedProps} />);

    expect(await screen.findByText("Mine")).toBeInTheDocument();
    expect(screen.queryByText("Theirs")).not.toBeInTheDocument();
    expect(screen.queryByText("Nobody's")).not.toBeInTheDocument();
  });

  it("falls back to the session username when id is absent", async () => {
    mockUser = {
      // no id
      username: "amelia",
      name: "amelia ward",
      email: "Amelia.Ward@Trellis.io",
    };
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({
        id: "t-by-username",
        subject: "Matched by username",
        assignedToId: "amelia",
      }),
      makeTicket({
        id: "t-by-id",
        subject: "Matched by id only",
        assignedToId: "auth|amelia",
      }),
    ]);

    render(<TicketListPage {...assignedProps} />);

    expect(await screen.findByText("Matched by username")).toBeInTheDocument();
    // The old id value must not match when id is absent.
    expect(screen.queryByText("Matched by id only")).not.toBeInTheDocument();
  });

  it("includes Completed and Canceled tickets assigned to the current agent (no terminal exclusion)", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({
        id: "t-done",
        subject: "All done",
        status: "Completed",
        assignedToId: "auth|amelia",
      }),
      makeTicket({
        id: "t-cancel",
        subject: "Dropped",
        status: "Canceled",
        assignedToId: "auth|amelia",
      }),
    ]);

    render(<TicketListPage {...assignedProps} />);

    expect(await screen.findByText("All done")).toBeInTheDocument();
    expect(screen.getByText("Dropped")).toBeInTheDocument();
  });

  it("never renders a Claim button, even for an Ongoing ticket assigned to the current agent", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({
        id: "t-mine",
        subject: "Mine ongoing",
        status: "Ongoing",
        assignedToId: "auth|amelia",
      }),
    ]);

    render(<TicketListPage {...assignedProps} />);

    await screen.findByText("Mine ongoing");
    expect(
      screen.queryByRole("button", { name: "Claim ticket" })
    ).not.toBeInTheDocument();
  });

  it("keeps the Status and Waiting On filters interactive", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({ id: "t-mine", subject: "Mine", assignedToId: "auth|amelia" }),
    ]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...assignedProps} />);

    await screen.findByText("Mine");

    await user.click(screen.getByLabelText("Filter by status"));
    await user.click(await screen.findByRole("option", { name: "Ongoing" }));

    await waitFor(() =>
      expect(conversationTicketsApi.list).toHaveBeenCalledWith(
        "Ongoing",
        "All",
        "All"
      )
    );
  });

  it("shows the assigned-empty message when the agent has no assigned tickets", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([]);

    render(<TicketListPage {...assignedProps} />);

    expect(
      await screen.findByText("No tickets are assigned to you.")
    ).toBeInTheDocument();
  });

  it("shows the assigned-empty message when only other agents' tickets come back (filtered to nothing at the default filter)", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({ id: "t-theirs", subject: "Theirs", assignedToId: "auth|bob" }),
    ]);

    render(<TicketListPage {...assignedProps} />);

    expect(
      await screen.findByText("No tickets are assigned to you.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Theirs")).not.toBeInTheDocument();
  });

  it("supports Cancel (with confirmation dialog) and updates the row in place from the mutation response", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({
        id: "t-1",
        subject: "Cannot log in",
        status: "Ongoing",
        assignedToId: "auth|amelia",
      }),
    ]);
    jest.mocked(conversationTicketsApi.changeStatus).mockResolvedValue(
      makeTicket({
        id: "t-1",
        subject: "Cannot log in",
        status: "Canceled",
        assignedToId: "auth|amelia",
      })
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...assignedProps} />);

    await user.click(
      await screen.findByRole("button", { name: "More options" })
    );
    await user.click(screen.getByText("Cancel"));

    // Dialog gates the call: nothing sent until the user confirms.
    expect(conversationTicketsApi.changeStatus).not.toHaveBeenCalled();

    const confirmButtons = screen.getAllByRole("button", {
      name: /Cancel Ticket/i,
    });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(conversationTicketsApi.changeStatus).toHaveBeenCalledWith(
        "t-1",
        { status: "Canceled" }
      )
    );

    // Ownership view: the ticket is still mine, so it stays — now showing the
    // Canceled status badge, updated in place with no full refetch.
    expect(await screen.findByText("Canceled")).toBeInTheDocument();
    expect(screen.getByText("Cannot log in")).toBeInTheDocument();
    expect(conversationTicketsApi.list).toHaveBeenCalledTimes(1);
  });

  it("navigates to the ticket detail page on row click", async () => {
    jest.mocked(conversationTicketsApi.list).mockResolvedValue([
      makeTicket({ id: "t-1", subject: "Cannot log in", assignedToId: "auth|amelia" }),
    ]);

    render(<TicketListPage {...assignedProps} />);

    const row = (await screen.findByText("Cannot log in")).closest("tr");
    expect(row).not.toBeNull();
    fireEvent.click(row!);
    expect(mockPush).toHaveBeenCalledWith("/tickets/t-1");
  });

  it("shows the loading skeleton before the fetch resolves", () => {
    let resolveList: (value: TicketListItem[]) => void = () => {};
    jest.mocked(conversationTicketsApi.list).mockReturnValue(
      new Promise<TicketListItem[]>((resolve) => {
        resolveList = resolve;
      })
    );

    render(<TicketListPage {...assignedProps} />);

    // The shared TableSkeleton renders while loading.
    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
    resolveList([]);
  });

  it("shows an inline error when the fetch fails", async () => {
    jest
      .mocked(conversationTicketsApi.list)
      .mockRejectedValue(new Error("Boom"));

    render(<TicketListPage {...assignedProps} />);

    expect(await screen.findByText("Boom")).toBeInTheDocument();
  });
});
