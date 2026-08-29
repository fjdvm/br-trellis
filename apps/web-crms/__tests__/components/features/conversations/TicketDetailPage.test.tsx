import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TicketDetailPage } from "@/components/features/conversations/TicketDetailPage";
import { crmClient } from "@/lib/api/crm-client";
import type { TicketDetail } from "@/types/ticket-detail";

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
    },
  },
}));

function makeTicket(overrides: Partial<TicketDetail> = {}): TicketDetail {
  return {
    id: "t-1",
    subject: "Cannot log in",
    status: "Unclaimed",
    waitingOn: "None",
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

const mocked = {
  getById: jest.mocked(crmClient.conversationTickets.getById),
  claim: jest.mocked(crmClient.conversationTickets.claim),
  unclaim: jest.mocked(crmClient.conversationTickets.unclaim),
  changeStatus: jest.mocked(crmClient.conversationTickets.changeStatus),
};

describe("TicketDetailPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.getById.mockResolvedValue(makeTicket());
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
  });

  it("shows an error state when the ticket fails to load", async () => {
    mocked.getById.mockRejectedValue(new Error("Ticket not found."));

    render(<TicketDetailPage ticketId="t-1" />);

    expect(await screen.findByText("Ticket not found.")).toBeInTheDocument();
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
});
