import { render, screen, waitFor } from "@testing-library/react";
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
    status: "Completed",
    waitingOn: "None",
    source: "Email",
    assignedToId: "auth|noah",
    assignedToName: "noah patel",
    assignedToEmail: "noah.patel@trellis.io",
    contactId: "c-1",
    contact: { id: "c-1", name: "jane doe", email: "JANE@EXAMPLE.COM" },
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-16T00:00:00Z",
    ...overrides,
  };
}

/** The exact prop set the History page wrapper passes to TicketListPage. */
const historyProps = {
  heading: "History",
  description: "Completed and canceled tickets across the whole team.",
  cardTitle: "Finished Tickets",
  terminalOnly: true,
  statusOptions: ["All", "Completed", "Canceled"] as const,
  showNewTicketButton: false,
  emptyMessage: "No finished tickets yet.",
  filteredEmptyMessage: "No tickets match the selected filters.",
};

describe("TicketListPage (History props)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
  });

  it("renders the overridden page copy (heading, description, card title)", async () => {
    render(<TicketListPage {...historyProps} />);

    expect(
      await screen.findByRole("heading", { name: "History" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Completed and canceled tickets across the whole team.")
    ).toBeInTheDocument();
    expect(screen.getByText("Finished Tickets")).toBeInTheDocument();
  });

  it("does not render the New Ticket button (History is a read-only record)", async () => {
    render(<TicketListPage {...historyProps} />);

    await screen.findByRole("heading", { name: "History" });
    expect(
      screen.queryByRole("button", { name: /New Ticket/i })
    ).not.toBeInTheDocument();
  });

  it("performs the initial fetch with no status sent to the server (terminal scoping is client-side)", async () => {
    render(<TicketListPage {...historyProps} />);

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith(
        "All",
        "All",
        "All"
      )
    );
  });

  it("shows terminal tickets from multiple agents (team-wide, not scoped to the signed-in agent)", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket({
        id: "t-mine",
        subject: "Mine done",
        status: "Completed",
        assignedToId: "auth|amelia",
      }),
      makeTicket({
        id: "t-theirs",
        subject: "Theirs canceled",
        status: "Canceled",
        assignedToId: "auth|bob",
      }),
      makeTicket({
        id: "t-unassigned",
        subject: "Nobody's done",
        status: "Completed",
        assignedToId: null,
        assignedToName: null,
      }),
    ]);

    render(<TicketListPage {...historyProps} />);

    // Every agent's finished tickets appear — no assignee scoping.
    expect(await screen.findByText("Mine done")).toBeInTheDocument();
    expect(screen.getByText("Theirs canceled")).toBeInTheDocument();
    expect(screen.getByText("Nobody's done")).toBeInTheDocument();
  });

  it("excludes non-terminal tickets returned by the API, regardless of filters", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket({ id: "t-done", subject: "All done", status: "Completed" }),
      makeTicket({ id: "t-cancel", subject: "Dropped", status: "Canceled" }),
      makeTicket({
        id: "t-open",
        subject: "Still open",
        status: "Ongoing",
        waitingOn: "Agent",
        assignedToId: "s-1",
      }),
      makeTicket({
        id: "t-unclaimed",
        subject: "Fresh",
        status: "Unclaimed",
        waitingOn: "Agent",
        assignedToId: null,
        assignedToName: null,
      }),
    ]);

    render(<TicketListPage {...historyProps} />);

    expect(await screen.findByText("All done")).toBeInTheDocument();
    expect(screen.getByText("Dropped")).toBeInTheDocument();
    // Non-terminal rows never surface in History.
    expect(screen.queryByText("Still open")).not.toBeInTheDocument();
    expect(screen.queryByText("Fresh")).not.toBeInTheDocument();
  });

  it("keeps excluding non-terminal tickets even after the Waiting On filter is changed", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket({ id: "t-done", subject: "All done", status: "Completed" }),
      makeTicket({
        id: "t-open",
        subject: "Still open",
        status: "Ongoing",
        waitingOn: "Customer",
        assignedToId: "s-1",
      }),
    ]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...historyProps} />);

    await screen.findByText("All done");

    await user.click(screen.getByLabelText("Filter by waiting on"));
    await user.click(await screen.findByRole("option", { name: "Customer" }));

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith(
        "All",
        "Customer",
        "All"
      )
    );

    // The Ongoing ticket matching the new filter is still excluded.
    expect(screen.getByText("All done")).toBeInTheDocument();
    expect(screen.queryByText("Still open")).not.toBeInTheDocument();
  });

  it("offers only All/Completed/Canceled in the narrowed Status dropdown", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...historyProps} />);

    await screen.findByText("No finished tickets yet.");

    await user.click(screen.getByLabelText("Filter by status"));

    // Narrowed set present.
    expect(
      await screen.findByRole("option", { name: "All statuses" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Completed" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Canceled" })).toBeInTheDocument();
    // The three non-terminal statuses are not selectable here.
    expect(
      screen.queryByRole("option", { name: "Unclaimed" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Claimed" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Ongoing" })
    ).not.toBeInTheDocument();
  });

  it("narrows to Completed-only when the Status filter is set to Completed", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...historyProps} />);

    await screen.findByText("No finished tickets yet.");

    await user.click(screen.getByLabelText("Filter by status"));
    await user.click(await screen.findByRole("option", { name: "Completed" }));

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith(
        "Completed",
        "All",
        "All"
      )
    );
  });

  it("exposes the Source filter, matching the Tickets screen", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketListPage {...historyProps} />);

    await screen.findByText("No finished tickets yet.");

    await user.click(screen.getByLabelText("Filter by source"));
    await user.click(await screen.findByRole("option", { name: "Manual" }));

    await waitFor(() =>
      expect(crmClient.conversationTickets.list).toHaveBeenCalledWith(
        "All",
        "All",
        "Manual"
      )
    );
  });

  it("shows the History-empty message when no finished tickets come back", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([]);

    render(<TicketListPage {...historyProps} />);

    expect(
      await screen.findByText("No finished tickets yet.")
    ).toBeInTheDocument();
  });

  it("shows the History-empty message when only non-terminal tickets come back (filtered to nothing)", async () => {
    jest.mocked(crmClient.conversationTickets.list).mockResolvedValue([
      makeTicket({
        id: "t-open",
        subject: "Still open",
        status: "Ongoing",
        assignedToId: "s-1",
      }),
    ]);

    render(<TicketListPage {...historyProps} />);

    // At the default filter, an empty result after terminal-only filtering is
    // still the History-empty message, not the narrowed one.
    expect(
      await screen.findByText("No finished tickets yet.")
    ).toBeInTheDocument();
    expect(screen.queryByText("Still open")).not.toBeInTheDocument();
  });
});
