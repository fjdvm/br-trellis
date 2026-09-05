import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketDetailPage } from "@/features/conversations/components/ticket-detail-page";
import { crmClient } from "@/lib/api/crm-client";
import type { TicketDetail } from "@/types/ticket-detail";

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
  useRouter: () => ({ push: mockPush }),
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
      getById: jest.fn(),
      claim: jest.fn(),
      unclaim: jest.fn(),
      changeStatus: jest.fn(),
      setWaitingOn: jest.fn(),
    },
    conversationMessages: {
      listByTicket: jest.fn(),
      postStaffMessage: jest.fn(),
    },
  },
}));

function makeTicket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: "t-1",
    subject: "Cannot log in",
    status: "Unclaimed",
    waitingOn: "None",
    source: "Email",
    assignedToId: null,
    assignedToName: null,
    assignedToEmail: null,
    contactId: "c-1",
    contact: { id: "c-1", name: "jane doe", email: "JANE@EXAMPLE.COM" },
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-16T00:00:00Z",
    canceledBy: null,
    ...overrides,
  };
}

const mocked = {
  getById: jest.mocked(crmClient.conversationTickets.getById),
  claim: jest.mocked(crmClient.conversationTickets.claim),
  unclaim: jest.mocked(crmClient.conversationTickets.unclaim),
  changeStatus: jest.mocked(crmClient.conversationTickets.changeStatus),
  setWaitingOn: jest.mocked(crmClient.conversationTickets.setWaitingOn),
  listMessages: jest.mocked(crmClient.conversationMessages.listByTicket),
};

describe("TicketDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.getById.mockResolvedValue(makeTicket());
    // MessageThread mounts inside the page and fetches on mount; default to an
    // empty thread so the page's own tests don't hit an unmocked call.
    mocked.listMessages.mockResolvedValue([]);
  });

  it("shows the detail skeleton while loading", async () => {
    let resolve: (t: TicketDetail) => void = () => {};
    mocked.getById.mockReturnValue(
      new Promise<TicketDetail>((r) => {
        resolve = r;
      })
    );

    render(<TicketDetailPage ticketId="t-1" />);
    expect(screen.getByTestId("detail-skeleton")).toBeInTheDocument();

    resolve(makeTicket());
    await waitFor(() =>
      expect(screen.queryByTestId("detail-skeleton")).not.toBeInTheDocument()
    );
  });

  it("renders subject, status badge, and formatted assignee", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({
        status: "Claimed",
        assignedToId: "auth|noah",
        assignedToName: "noah patel",
        assignedToEmail: "NOAH@TRELLIS.IO",
      })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    expect(await screen.findByText("Cannot log in")).toBeInTheDocument();
    expect(screen.getByText("Claimed")).toBeInTheDocument();
    // Assignee name/email appear in both the header subtext and the details card.
    expect(screen.getAllByText("Noah Patel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("noah@trellis.io").length).toBeGreaterThan(0);

    // Owner-only gate: this ticket belongs to another agent (auth|noah), so the
    // signed-in agent (auth|amelia) gets no lifecycle actions.
    expect(
      screen.queryByRole("button", { name: "Unclaim" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Cancel Ticket" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Mark / })
    ).not.toBeInTheDocument();
  });

  it("shows who cancelled the ticket (customer) when canceled", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Canceled", canceledBy: "Customer" })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    await screen.findByText("Cannot log in");
    expect(await screen.findByTestId("cancel-attribution")).toHaveTextContent(
      "Customer cancelled the ticket"
    );
  });

  it("shows who cancelled the ticket (staff role + name) when canceled", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Canceled", canceledBy: "Super Admin Alice" })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    await screen.findByText("Cannot log in");
    expect(screen.getByTestId("cancel-attribution")).toHaveTextContent(
      "Super Admin Alice cancelled the ticket"
    );
  });

  it("does not show a cancel attribution on a non-canceled ticket", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Claimed" }));

    render(<TicketDetailPage ticketId="t-1" />);

    await screen.findByText("Cannot log in");
    expect(screen.queryByTestId("cancel-attribution")).not.toBeInTheDocument();
  });

  it("shows owner lifecycle actions when the signed-in agent owns the ticket", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({
        status: "Claimed",
        assignedToId: "auth|amelia",
        assignedToName: "amelia ward",
        assignedToEmail: "amelia@trellis.io",
      })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    await screen.findByText("Cannot log in");
    // Owner sees Unclaim, the next-status advance, and Cancel.
    expect(screen.getByRole("button", { name: "Unclaim" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel Ticket" })
    ).toBeInTheDocument();
  });

  it("shows an error state when the ticket fails to load", async () => {
    mocked.getById.mockRejectedValue(new Error("Ticket not found."));

    render(<TicketDetailPage ticketId="t-1" />);

    expect(await screen.findByText("Ticket not found.")).toBeInTheDocument();
  });

  it("renders a Source badge next to the Status badge", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", source: "Manual", assignedToId: "auth|amelia" })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    // Status and Source both render as badges in the header.
    expect(await screen.findByText("Claimed")).toBeInTheDocument();
    expect(screen.getByText("Manual")).toBeInTheDocument();
  });

  // --- View Conversation link (#101): the inline thread was removed from the
  // lifecycle detail page; a link to the Conversations section replaces it. ---

  it("does not render the message thread inline anymore", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia" })
    );

    render(<TicketDetailPage ticketId="t-1" />);
    await screen.findByText("Cannot log in");

    // The old inline thread column and its reply composer are gone.
    expect(document.querySelector('[data-testid="messages-column"]')).toBeNull();
    expect(screen.queryByLabelText("Reply")).not.toBeInTheDocument();
    // The page no longer fetches the message thread.
    expect(mocked.listMessages).not.toHaveBeenCalled();
  });

  it("shows a 'View Conversation' link on a Claimed ticket, pointing at the conversation route", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia" })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    const link = await screen.findByRole("link", { name: /View Conversation/ });
    expect(link).toHaveAttribute("href", "/conversations/inbox/t-1");
  });

  it("shows a 'View Conversation' link on an Ongoing ticket", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Ongoing", assignedToId: "auth|amelia" })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    expect(
      await screen.findByRole("link", { name: /View Conversation/ })
    ).toBeInTheDocument();
  });

  it("hides the 'View Conversation' link on an Unclaimed ticket", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Unclaimed" }));

    render(<TicketDetailPage ticketId="t-1" />);
    await screen.findByText("Cannot log in");

    expect(
      screen.queryByRole("link", { name: /View Conversation/ })
    ).not.toBeInTheDocument();
  });

  it("hides the 'View Conversation' link on a Completed ticket", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Completed" }));

    render(<TicketDetailPage ticketId="t-1" />);
    await screen.findByText("Completed");

    expect(
      screen.queryByRole("link", { name: /View Conversation/ })
    ).not.toBeInTheDocument();
  });

  it("hides the 'View Conversation' link on a Canceled ticket", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Canceled" }));

    render(<TicketDetailPage ticketId="t-1" />);
    await screen.findByText("Canceled");

    expect(
      screen.queryByRole("link", { name: /View Conversation/ })
    ).not.toBeInTheDocument();
  });

  // --- Claim ---

  it("shows only a Claim button for an Unclaimed ticket and claims with session identity", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Unclaimed" }));
    mocked.claim.mockResolvedValue(
      makeTicket({
        status: "Claimed",
        assignedToId: "auth|amelia",
        assignedToName: "amelia ward",
        assignedToEmail: "amelia.ward@trellis.io",
      })
    );

    render(<TicketDetailPage ticketId="t-1" />);
    const claimBtn = await screen.findByRole("button", { name: /^Claim$/ });

    expect(screen.queryByRole("button", { name: /Unclaim/ })).not.toBeInTheDocument();

    fireEvent.click(claimBtn);

    await waitFor(() =>
      expect(mocked.claim).toHaveBeenCalledWith("t-1", {
        staffId: "auth|amelia",
        staffName: "amelia ward",
        staffEmail: "Amelia.Ward@Trellis.io",
      })
    );
    // UI reflects the response
    expect(await screen.findByText("Claimed")).toBeInTheDocument();
  });

  it("shows a Claim button for an Ongoing ticket with a null assignee", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Ongoing", assignedToId: null })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    expect(await screen.findByRole("button", { name: /^Claim$/ })).toBeInTheDocument();
  });

  it("surfaces the real backend error when a claim is rejected", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Unclaimed" }));
    mocked.claim.mockRejectedValue(
      new Error(
        "Ticket cannot be claimed from status 'Claimed' while assigned to another agent."
      )
    );

    render(<TicketDetailPage ticketId="t-1" />);
    fireEvent.click(await screen.findByRole("button", { name: /^Claim$/ }));

    expect(
      await screen.findByText(
        "Ticket cannot be claimed from status 'Claimed' while assigned to another agent."
      )
    ).toBeInTheDocument();
  });

  // --- Unclaim + advance ---

  it("shows Unclaim and 'Mark Ongoing' for a Claimed ticket", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia" })
    );
    mocked.unclaim.mockResolvedValue(makeTicket({ status: "Unclaimed" }));

    render(<TicketDetailPage ticketId="t-1" />);

    expect(await screen.findByRole("button", { name: /Unclaim/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Mark Ongoing/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Claim$/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Unclaim/ }));
    await waitFor(() => expect(mocked.unclaim).toHaveBeenCalledWith("t-1"));
  });

  it("advances a Claimed ticket to Ongoing", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia" })
    );
    mocked.changeStatus.mockResolvedValue(makeTicket({ status: "Ongoing" }));

    render(<TicketDetailPage ticketId="t-1" />);
    fireEvent.click(await screen.findByRole("button", { name: /Mark Ongoing/ }));

    await waitFor(() =>
      expect(mocked.changeStatus).toHaveBeenCalledWith("t-1", { status: "Ongoing" })
    );
  });

  it("advances an Ongoing (assigned) ticket to Completed", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Ongoing", assignedToId: "auth|amelia" })
    );
    mocked.changeStatus.mockResolvedValue(makeTicket({ status: "Completed" }));

    render(<TicketDetailPage ticketId="t-1" />);
    fireEvent.click(await screen.findByRole("button", { name: /Mark Completed/ }));

    await waitFor(() =>
      expect(mocked.changeStatus).toHaveBeenCalledWith("t-1", { status: "Completed" })
    );
  });

  // --- Cancel (confirmation-gated) ---

  it("cancels a ticket only after confirming in the dialog", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia" })
    );
    mocked.changeStatus.mockResolvedValue(makeTicket({ status: "Canceled" }));
    const user = userEvent.setup();

    render(<TicketDetailPage ticketId="t-1" />);
    await user.click(await screen.findByRole("button", { name: /Cancel Ticket/ }));

    // Dialog open; API not called yet.
    expect(mocked.changeStatus).not.toHaveBeenCalled();

    // Confirm in the dialog: the dialog's confirm action is the last
    // "Cancel Ticket" button (the header button is the first).
    const confirmButtons = screen.getAllByRole("button", { name: /Cancel Ticket/ });
    await user.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() =>
      expect(mocked.changeStatus).toHaveBeenCalledWith("t-1", { status: "Canceled" })
    );
  });

  // --- Terminal states ---

  it("renders no action buttons for a Completed ticket", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Completed" }));

    render(<TicketDetailPage ticketId="t-1" />);
    await screen.findByText("Completed");

    expect(screen.queryByRole("button", { name: /^Claim$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Unclaim/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Mark / })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel Ticket/ })).not.toBeInTheDocument();
  });

  it("renders no action buttons for a Canceled ticket", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Canceled" }));

    render(<TicketDetailPage ticketId="t-1" />);
    await screen.findByText("Canceled");

    expect(screen.queryByRole("button", { name: /^Claim$/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cancel Ticket/ })).not.toBeInTheDocument();
  });

  // --- Loading / disabled during mutation ---

  it("disables the Claim button while the claim is in flight", async () => {
    mocked.getById.mockResolvedValue(makeTicket({ status: "Unclaimed" }));
    let resolveClaim: (t: TicketDetail) => void = () => {};
    mocked.claim.mockReturnValue(
      new Promise<TicketDetail>((r) => {
        resolveClaim = r;
      })
    );

    render(<TicketDetailPage ticketId="t-1" />);
    const claimBtn = await screen.findByRole("button", { name: /^Claim$/ });
    fireEvent.click(claimBtn);

    await waitFor(() => expect(claimBtn).toBeDisabled());

    resolveClaim(makeTicket({ status: "Claimed", assignedToId: "auth|amelia" }));
    await waitFor(() =>
      expect(screen.getByText("Claimed")).toBeInTheDocument()
    );
  });

  // --- WaitingOn Select (feature 3, #82) ---

  it("renders the WaitingOn Select pre-selected to the ticket's current value", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia", waitingOn: "Customer" })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    const select = await screen.findByLabelText("Set waiting on");
    // Radix renders the selected item's text inside the trigger.
    expect(select).toHaveTextContent("Customer");
  });

  it("changes WaitingOn and updates the displayed value from the response body", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia", waitingOn: "None" })
    );
    mocked.setWaitingOn.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia", waitingOn: "Agent" })
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketDetailPage ticketId="t-1" />);

    await user.click(await screen.findByLabelText("Set waiting on"));
    await user.click(await screen.findByRole("option", { name: "Agent" }));

    await waitFor(() =>
      expect(mocked.setWaitingOn).toHaveBeenCalledWith("t-1", { waitingOn: "Agent" })
    );
    // Displayed value comes from the response body, no follow-up GET.
    await waitFor(() =>
      expect(screen.getByLabelText("Set waiting on")).toHaveTextContent("Agent")
    );
    expect(mocked.getById).toHaveBeenCalledTimes(1);
  });

  it("surfaces the real backend error in the shared actionError slot and keeps the prior value", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia", waitingOn: "Customer" })
    );
    mocked.setWaitingOn.mockRejectedValue(new Error("Invalid WaitingOn value."));
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketDetailPage ticketId="t-1" />);

    await user.click(await screen.findByLabelText("Set waiting on"));
    await user.click(await screen.findByRole("option", { name: "Agent" }));

    expect(await screen.findByText("Invalid WaitingOn value.")).toBeInTheDocument();
    // No optimistic update: the previously-displayed value is still shown.
    expect(screen.getByLabelText("Set waiting on")).toHaveTextContent("Customer");
  });

  it("disables the WaitingOn Select while its own mutation is in flight", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia", waitingOn: "None" })
    );
    let resolveSet: (t: TicketDetail) => void = () => {};
    mocked.setWaitingOn.mockReturnValue(
      new Promise<TicketDetail>((r) => {
        resolveSet = r;
      })
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketDetailPage ticketId="t-1" />);

    await user.click(await screen.findByLabelText("Set waiting on"));
    await user.click(await screen.findByRole("option", { name: "Agent" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Set waiting on")).toBeDisabled()
    );

    resolveSet(
      makeTicket({ status: "Claimed", assignedToId: "auth|amelia", waitingOn: "Agent" })
    );
    await waitFor(() =>
      expect(screen.getByLabelText("Set waiting on")).not.toBeDisabled()
    );
  });

  it("renders the WaitingOn Select disabled but visible on a Completed ticket", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Completed", waitingOn: "Customer" })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    const select = await screen.findByLabelText("Set waiting on");
    expect(select).toBeInTheDocument();
    expect(select).toBeDisabled();
    expect(select).toHaveTextContent("Customer");
  });

  it("renders the WaitingOn Select disabled but visible on a Canceled ticket", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({ status: "Canceled", waitingOn: "Agent" })
    );

    render(<TicketDetailPage ticketId="t-1" />);

    const select = await screen.findByLabelText("Set waiting on");
    expect(select).toBeInTheDocument();
    expect(select).toBeDisabled();
    expect(select).toHaveTextContent("Agent");
  });

  it("does not change the Status badge or assignee when WaitingOn changes", async () => {
    mocked.getById.mockResolvedValue(
      makeTicket({
        status: "Claimed",
        waitingOn: "None",
        assignedToId: "auth|noah",
        assignedToName: "noah patel",
        assignedToEmail: "NOAH@TRELLIS.IO",
      })
    );
    mocked.setWaitingOn.mockResolvedValue(
      makeTicket({
        status: "Claimed",
        waitingOn: "Agent",
        assignedToId: "auth|noah",
        assignedToName: "noah patel",
        assignedToEmail: "NOAH@TRELLIS.IO",
      })
    );
    const user = userEvent.setup({ pointerEventsCheck: 0 });

    render(<TicketDetailPage ticketId="t-1" />);

    await user.click(await screen.findByLabelText("Set waiting on"));
    await user.click(await screen.findByRole("option", { name: "Agent" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Set waiting on")).toHaveTextContent("Agent")
    );
    // Status badge and assignee remain unchanged.
    expect(screen.getByText("Claimed")).toBeInTheDocument();
    expect(screen.getAllByText("Noah Patel").length).toBeGreaterThan(0);
    expect(screen.getAllByText("noah@trellis.io").length).toBeGreaterThan(0);
  });
});
