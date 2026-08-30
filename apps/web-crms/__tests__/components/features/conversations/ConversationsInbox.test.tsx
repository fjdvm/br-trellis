import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConversationsInbox } from "@/components/features/conversations/ConversationsInbox";
import { crmClient } from "@/lib/api/crm-client";
import type { TicketListItem } from "@/types/ticket-list";

// Radix/jsdom polyfills consistent with the other conversations suites.
beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// A mutable session identity so tests can exercise the id vs. username fallback
// — the same identity source Claim and My Assigned use.
type MockUser = { id?: string; username?: string; name?: string; email?: string };
let mockUser: MockUser = {
  id: "auth|amelia",
  username: "amelia",
  name: "amelia ward",
  email: "amelia.ward@trellis.io",
};

jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: mockUser }, status: "authenticated" }),
}));

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    conversationTickets: {
      list: jest.fn(),
      getById: jest.fn(),
      setWaitingOn: jest.fn(),
    },
    conversationMessages: {
      listByTicket: jest.fn(),
      postStaffMessage: jest.fn(),
    },
  },
}));

const mocked = {
  list: jest.mocked(crmClient.conversationTickets.list),
  getById: jest.mocked(crmClient.conversationTickets.getById),
  setWaitingOn: jest.mocked(crmClient.conversationTickets.setWaitingOn),
  listMessages: jest.mocked(crmClient.conversationMessages.listByTicket),
  postMessage: jest.mocked(crmClient.conversationMessages.postStaffMessage),
};

function makeTicket(overrides: Partial<TicketListItem> = {}): TicketListItem {
  return {
    id: "t-1",
    subject: "Cannot log in",
    status: "Ongoing",
    waitingOn: "Agent",
    assignedToId: "auth|amelia",
    assignedToName: "amelia ward",
    assignedToEmail: "amelia.ward@trellis.io",
    contactId: "c-1",
    contact: { id: "c-1", name: "jane doe", email: "jane@example.com" },
    createdAt: "2025-01-15T00:00:00Z",
    updatedAt: "2025-01-16T00:00:00Z",
    ...overrides,
  };
}

describe("ConversationsInbox — Visibility Rule", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      id: "auth|amelia",
      username: "amelia",
      name: "amelia ward",
      email: "amelia.ward@trellis.io",
    };
    mocked.listMessages.mockResolvedValue([]);
  });

  it("lists only Claimed/Ongoing conversations assigned to the signed-in agent", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "mine-claimed", subject: "Mine claimed", status: "Claimed", contact: { id: "c1", name: "aaa contact", email: "a@x.com" } }),
      makeTicket({ id: "mine-ongoing", subject: "Mine ongoing", status: "Ongoing", contact: { id: "c2", name: "bbb contact", email: "b@x.com" } }),
      // Excluded: unclaimed (no owner)
      makeTicket({ id: "unclaimed", subject: "Unclaimed one", status: "Unclaimed", assignedToId: null, contact: { id: "c3", name: "ccc contact", email: "c@x.com" } }),
      // Excluded: assigned to someone else
      makeTicket({ id: "other", subject: "Someone elses", status: "Ongoing", assignedToId: "auth|noah", contact: { id: "c4", name: "ddd contact", email: "d@x.com" } }),
      // Excluded: my ticket but terminal
      makeTicket({ id: "mine-completed", subject: "Mine done", status: "Completed", contact: { id: "c5", name: "eee contact", email: "e@x.com" } }),
      makeTicket({ id: "mine-canceled", subject: "Mine canceled", status: "Canceled", contact: { id: "c6", name: "fff contact", email: "f@x.com" } }),
    ]);

    render(<ConversationsInbox />);

    expect(await screen.findByText("Aaa Contact")).toBeInTheDocument();
    expect(screen.getByText("Bbb Contact")).toBeInTheDocument();

    expect(screen.queryByText("Ccc Contact")).not.toBeInTheDocument();
    expect(screen.queryByText("Ddd Contact")).not.toBeInTheDocument();
    expect(screen.queryByText("Eee Contact")).not.toBeInTheDocument();
    expect(screen.queryByText("Fff Contact")).not.toBeInTheDocument();
  });

  it("matches ownership by username when the session has no id (fallback)", async () => {
    mockUser = { username: "amelia", name: "amelia ward", email: "amelia.ward@trellis.io" };
    mocked.list.mockResolvedValue([
      makeTicket({ id: "by-username", subject: "By username", status: "Ongoing", assignedToId: "amelia", contact: { id: "c1", name: "username match", email: "u@x.com" } }),
      makeTicket({ id: "by-id", subject: "By id", status: "Ongoing", assignedToId: "auth|amelia", contact: { id: "c2", name: "id only", email: "i@x.com" } }),
    ]);

    render(<ConversationsInbox />);

    expect(await screen.findByText("Username Match")).toBeInTheDocument();
    // The id-keyed ticket doesn't match when identity resolves to the username.
    expect(screen.queryByText("Id Only")).not.toBeInTheDocument();
  });

  it("shows an empty state when the agent has no qualifying conversations", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "other", status: "Ongoing", assignedToId: "auth|noah" }),
    ]);

    render(<ConversationsInbox />);

    expect(
      await screen.findByText("Nothing to work on right now.")
    ).toBeInTheDocument();
  });

  it("sorts conversations most-recently-updated first", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "older", subject: "Older", status: "Ongoing", updatedAt: "2025-01-10T00:00:00Z", contact: { id: "c1", name: "older contact", email: "o@x.com" } }),
      makeTicket({ id: "newer", subject: "Newer", status: "Ongoing", updatedAt: "2025-01-20T00:00:00Z", contact: { id: "c2", name: "newer contact", email: "n@x.com" } }),
    ]);

    render(<ConversationsInbox />);

    const list = await screen.findByRole("list", { name: "Conversations" });
    const items = list.querySelectorAll("li");
    expect(items[0]).toHaveTextContent("Newer Contact");
    expect(items[1]).toHaveTextContent("Older Contact");
  });
});

describe("ConversationsInbox — pane + navigation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = {
      id: "auth|amelia",
      username: "amelia",
      name: "amelia ward",
      email: "amelia.ward@trellis.io",
    };
    mocked.listMessages.mockResolvedValue([]);
  });

  it("shows a placeholder in the pane when no conversation is selected", async () => {
    mocked.list.mockResolvedValue([makeTicket()]);

    render(<ConversationsInbox />);

    expect(
      await screen.findByText("No Conversation Selected")
    ).toBeInTheDocument();
  });

  it("navigates to the conversation's own route when a thread is selected", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", status: "Ongoing", contact: { id: "c1", name: "jane doe", email: "jane@x.com" } }),
    ]);

    render(<ConversationsInbox />);

    fireEvent.click(await screen.findByText("Jane Doe"));
    expect(mockPush).toHaveBeenCalledWith("/conversations/inbox/t-1");
  });

  it("opens the message thread for the selected conversation from the loaded list", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", status: "Ongoing", contact: { id: "c1", name: "jane doe", email: "jane@x.com" } }),
    ]);
    mocked.listMessages.mockResolvedValue([
      {
        id: "m-1",
        ticketId: "t-1",
        senderType: "Contact",
        senderContactId: "c1",
        senderStaffId: null,
        senderStaffName: null,
        content: "I need help",
        sentAt: "2025-01-15T10:00:00Z",
      },
    ]);

    render(<ConversationsInbox selectedTicketId="t-1" />);

    expect(await screen.findByText("I need help")).toBeInTheDocument();
    // The thread was fetched for the selected ticket; no getById needed because
    // the row is already in the loaded list.
    expect(mocked.listMessages).toHaveBeenCalledWith("t-1");
    expect(mocked.getById).not.toHaveBeenCalled();
  });

  it("deep-links a conversation outside the worklist by fetching it by id", async () => {
    // The list holds only my worklist; the selected id belongs to a colleague.
    mocked.list.mockResolvedValue([]);
    mocked.getById.mockResolvedValue({
      id: "colleague-1",
      subject: "Colleague ticket",
      status: "Ongoing",
      waitingOn: "Agent",
      assignedToId: "auth|noah",
      assignedToName: "noah patel",
      assignedToEmail: "noah@trellis.io",
      contactId: "c9",
      contact: { id: "c9", name: "carl contact", email: "carl@x.com" },
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2025-01-02T00:00:00Z",
    });

    render(<ConversationsInbox selectedTicketId="colleague-1" />);

    // Empty worklist list, but the pane still opens the deep-linked thread.
    expect(
      await screen.findByText("Nothing to work on right now.")
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(mocked.getById).toHaveBeenCalledWith("colleague-1")
    );
    // The pane's thread header shows the fetched contact (title-cased).
    expect(await screen.findByText("Carl Contact")).toBeInTheDocument();
  });

  it("flips WaitingOn to Customer after a reply is sent from the pane", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", status: "Ongoing", waitingOn: "Agent", contact: { id: "c1", name: "jane doe", email: "jane@x.com" } }),
    ]);
    mocked.listMessages.mockResolvedValue([]);
    mocked.postMessage.mockResolvedValue({
      id: "server-1",
      ticketId: "t-1",
      senderType: "Staff",
      senderContactId: null,
      senderStaffId: "auth|amelia",
      senderStaffName: "amelia ward",
      content: "Following up",
      sentAt: "2025-01-15T11:00:00Z",
    });
    mocked.setWaitingOn.mockResolvedValue({
      id: "t-1",
      subject: "Cannot log in",
      status: "Ongoing",
      waitingOn: "Customer",
      assignedToId: "auth|amelia",
      assignedToName: "amelia ward",
      assignedToEmail: "amelia.ward@trellis.io",
      contactId: "c1",
      contact: { id: "c1", name: "jane doe", email: "jane@x.com" },
      createdAt: "2025-01-15T00:00:00Z",
      updatedAt: "2025-01-16T00:00:00Z",
    });
    const user = userEvent.setup();

    render(<ConversationsInbox selectedTicketId="t-1" />);

    await user.type(await screen.findByLabelText("Reply"), "Following up");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(mocked.setWaitingOn).toHaveBeenCalledWith("t-1", {
        waitingOn: "Customer",
      })
    );
  });

  it("disables the composer for a terminal (deep-linked) conversation", async () => {
    mocked.list.mockResolvedValue([]);
    mocked.getById.mockResolvedValue({
      id: "done-1",
      subject: "Done ticket",
      status: "Completed",
      waitingOn: "None",
      assignedToId: "auth|amelia",
      assignedToName: "amelia ward",
      assignedToEmail: "amelia.ward@trellis.io",
      contactId: "c1",
      contact: { id: "c1", name: "jane doe", email: "jane@x.com" },
      createdAt: "2025-01-15T00:00:00Z",
      updatedAt: "2025-01-16T00:00:00Z",
    });

    render(<ConversationsInbox selectedTicketId="done-1" />);

    await waitFor(() => expect(mocked.getById).toHaveBeenCalledWith("done-1"));
    await waitFor(() =>
      expect(screen.getByLabelText("Reply")).toBeDisabled()
    );
  });
});
