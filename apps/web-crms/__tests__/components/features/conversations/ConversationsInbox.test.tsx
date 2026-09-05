import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {  ConversationsInbox  } from "@/features/conversations/components/conversations-inbox";
import { crmClient } from "@/lib/api/crm-client";
import { useSignalR } from "@/hooks/useSignalR";
import type { TicketListItem } from "@/features/conversations/types";

// Radix/jsdom polyfills consistent with the other conversations suites.
beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  // Radix Select relies on pointer-capture APIs that jsdom does not implement.
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {};
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {};
  }
});

const mockPush = jest.fn();
let mockPathname = "/conversations/inbox";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
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

// Real-time hook mocked to a no-op (it's covered by its own test). Capturing the
// options lets the ticket-list-events suite drive its onNewTicketAvailable /
// onTicketStatusChanged callbacks directly, without a live SignalR connection.
jest.mock("@/hooks/useSignalR", () => ({
  useSignalR: jest.fn(),
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
    source: "Email",
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

describe("ConversationsInbox — conversation filter", () => {
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

  it("defaults to All, showing every active conversation", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "c", subject: "Claimed one", status: "Claimed", contact: { id: "c1", name: "claimed contact", email: "cl@x.com" } }),
      makeTicket({ id: "o", subject: "Ongoing one", status: "Ongoing", contact: { id: "c2", name: "ongoing contact", email: "on@x.com" } }),
    ]);

    render(<ConversationsInbox />);

    expect(await screen.findByText("Claimed Contact")).toBeInTheDocument();
    expect(screen.getByText("Ongoing Contact")).toBeInTheDocument();
    // The trigger reflects the default "All" selection.
    expect(
      screen.getByLabelText("Filter conversations")
    ).toHaveTextContent("All");
  });

  it("offers exactly All, Claimed, Ongoing, Read, Unread as options", async () => {
    mocked.list.mockResolvedValue([makeTicket({ id: "c", status: "Claimed" })]);
    const user = userEvent.setup();

    render(<ConversationsInbox />);
    await screen.findByLabelText("Filter conversations");

    await user.click(screen.getByLabelText("Filter conversations"));

    const options = await screen.findAllByRole("option");
    expect(options.map((o) => o.textContent)).toEqual([
      "All",
      "Claimed",
      "Ongoing",
      "Read",
      "Unread",
    ]);
  });

  it("narrows to Claimed only when that filter is chosen", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "c", subject: "Claimed one", status: "Claimed", contact: { id: "c1", name: "claimed contact", email: "cl@x.com" } }),
      makeTicket({ id: "o", subject: "Ongoing one", status: "Ongoing", contact: { id: "c2", name: "ongoing contact", email: "on@x.com" } }),
    ]);
    const user = userEvent.setup();

    render(<ConversationsInbox />);
    await screen.findByText("Claimed Contact");

    await user.click(screen.getByLabelText("Filter conversations"));
    await user.click(await screen.findByRole("option", { name: "Claimed" }));

    expect(screen.getByText("Claimed Contact")).toBeInTheDocument();
    expect(screen.queryByText("Ongoing Contact")).not.toBeInTheDocument();
  });

  it("narrows to Ongoing only when that filter is chosen", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "c", subject: "Claimed one", status: "Claimed", contact: { id: "c1", name: "claimed contact", email: "cl@x.com" } }),
      makeTicket({ id: "o", subject: "Ongoing one", status: "Ongoing", contact: { id: "c2", name: "ongoing contact", email: "on@x.com" } }),
    ]);
    const user = userEvent.setup();

    render(<ConversationsInbox />);
    await screen.findByText("Ongoing Contact");

    await user.click(screen.getByLabelText("Filter conversations"));
    await user.click(await screen.findByRole("option", { name: "Ongoing" }));

    expect(screen.getByText("Ongoing Contact")).toBeInTheDocument();
    expect(screen.queryByText("Claimed Contact")).not.toBeInTheDocument();
  });

  it("Unread keeps only conversations awaiting the agent (waitingOn Agent)", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "u", subject: "Awaiting agent", status: "Ongoing", waitingOn: "Agent", contact: { id: "c1", name: "unread contact", email: "u@x.com" } }),
      makeTicket({ id: "r", subject: "Waiting on customer", status: "Ongoing", waitingOn: "Customer", contact: { id: "c2", name: "read contact", email: "r@x.com" } }),
    ]);
    const user = userEvent.setup();

    render(<ConversationsInbox />);
    await screen.findByText("Unread Contact");

    await user.click(screen.getByLabelText("Filter conversations"));
    await user.click(await screen.findByRole("option", { name: "Unread" }));

    expect(screen.getByText("Unread Contact")).toBeInTheDocument();
    expect(screen.queryByText("Read Contact")).not.toBeInTheDocument();
  });

  it("Read keeps only conversations not awaiting the agent", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "u", subject: "Awaiting agent", status: "Ongoing", waitingOn: "Agent", contact: { id: "c1", name: "unread contact", email: "u@x.com" } }),
      makeTicket({ id: "r", subject: "Waiting on customer", status: "Ongoing", waitingOn: "Customer", contact: { id: "c2", name: "read contact", email: "r@x.com" } }),
      makeTicket({ id: "n", subject: "Nobody waiting", status: "Ongoing", waitingOn: "None", contact: { id: "c3", name: "none contact", email: "n@x.com" } }),
    ]);
    const user = userEvent.setup();

    render(<ConversationsInbox />);
    await screen.findByText("Read Contact");

    await user.click(screen.getByLabelText("Filter conversations"));
    await user.click(await screen.findByRole("option", { name: "Read" }));

    expect(screen.getByText("Read Contact")).toBeInTheDocument();
    expect(screen.getByText("None Contact")).toBeInTheDocument();
    expect(screen.queryByText("Unread Contact")).not.toBeInTheDocument();
  });

  it("never shows terminal tickets regardless of the chosen filter", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "c", subject: "Claimed one", status: "Claimed", contact: { id: "c1", name: "claimed contact", email: "cl@x.com" } }),
      makeTicket({ id: "done", subject: "Done", status: "Completed", contact: { id: "c2", name: "done contact", email: "d@x.com" } }),
      makeTicket({ id: "cancel", subject: "Canceled", status: "Canceled", contact: { id: "c3", name: "cancel contact", email: "x@x.com" } }),
    ]);
    const user = userEvent.setup();

    render(<ConversationsInbox />);

    // Default (All): terminal tickets hidden.
    expect(await screen.findByText("Claimed Contact")).toBeInTheDocument();
    expect(screen.queryByText("Done Contact")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel Contact")).not.toBeInTheDocument();

    // Narrowing to Claimed still hides terminal tickets.
    await user.click(screen.getByLabelText("Filter conversations"));
    await user.click(await screen.findByRole("option", { name: "Claimed" }));
    expect(screen.getByText("Claimed Contact")).toBeInTheDocument();
    expect(screen.queryByText("Done Contact")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancel Contact")).not.toBeInTheDocument();
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
      source: "Email",
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
      source: "Email",
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
      source: "Email",
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


describe("ConversationsInbox — mark read on view", () => {
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

  /** A full TicketDetail-shaped setWaitingOn response for the given fields. */
  function waitingOnResponse(
    id: string,
    waitingOn: "Agent" | "Customer" | "None",
    status: TicketListItem["status"] = "Ongoing"
  ) {
    return {
      id,
      subject: "Cannot log in",
      status,
      waitingOn,
      source: "Email" as const,
      assignedToId: "auth|amelia",
      assignedToName: "amelia ward",
      assignedToEmail: "amelia.ward@trellis.io",
      contactId: "c1",
      contact: { id: "c1", name: "jane doe", email: "jane@x.com" },
      createdAt: "2025-01-15T00:00:00Z",
      updatedAt: "2025-01-16T00:00:00Z",
    };
  }

  it("marks an unread conversation read (WaitingOn None) when it is opened", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", status: "Ongoing", waitingOn: "Agent", contact: { id: "c1", name: "jane doe", email: "jane@x.com" } }),
    ]);
    mocked.setWaitingOn.mockResolvedValue(waitingOnResponse("t-1", "None"));

    render(<ConversationsInbox selectedTicketId="t-1" />);

    await waitFor(() =>
      expect(mocked.setWaitingOn).toHaveBeenCalledWith("t-1", {
        waitingOn: "None",
      })
    );
  });

  it("clears the 'Waiting on you' badge for the opened conversation after marking read", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", status: "Ongoing", waitingOn: "Agent", contact: { id: "c1", name: "jane doe", email: "jane@x.com" } }),
    ]);
    mocked.setWaitingOn.mockResolvedValue(waitingOnResponse("t-1", "None"));

    render(<ConversationsInbox selectedTicketId="t-1" />);

    // The badge is present initially, then clears once the row is merged read.
    await waitFor(() =>
      expect(mocked.setWaitingOn).toHaveBeenCalledWith("t-1", {
        waitingOn: "None",
      })
    );
    await waitFor(() =>
      expect(screen.queryByText("Waiting on you")).not.toBeInTheDocument()
    );
  });

  it("does not mark read a conversation already waiting on the customer", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", status: "Ongoing", waitingOn: "Customer", contact: { id: "c1", name: "jane doe", email: "jane@x.com" } }),
    ]);

    render(<ConversationsInbox selectedTicketId="t-1" />);

    // The row renders (list + pane header both show the contact).
    await screen.findAllByText("Jane Doe");
    // Give any effect a chance to run, then assert no mark-read fired.
    await waitFor(() => expect(mocked.list).toHaveBeenCalled());
    expect(mocked.setWaitingOn).not.toHaveBeenCalled();
  });

  it("does not mark read a terminal conversation", async () => {
    // Terminal rows aren't in the worklist list; deep-linked via getById.
    mocked.list.mockResolvedValue([]);
    mocked.getById.mockResolvedValue(
      waitingOnResponse("done-1", "Agent", "Completed")
    );

    render(<ConversationsInbox selectedTicketId="done-1" />);

    await waitFor(() => expect(mocked.getById).toHaveBeenCalledWith("done-1"));
    expect(mocked.setWaitingOn).not.toHaveBeenCalled();
  });

  it("marks read only once even as the row re-renders", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", status: "Ongoing", waitingOn: "Agent", contact: { id: "c1", name: "jane doe", email: "jane@x.com" } }),
    ]);
    mocked.setWaitingOn.mockResolvedValue(waitingOnResponse("t-1", "None"));

    render(<ConversationsInbox selectedTicketId="t-1" />);

    await waitFor(() =>
      expect(mocked.setWaitingOn).toHaveBeenCalledTimes(1)
    );
    // Even after the merged (read) row re-renders, no second call fires.
    await waitFor(() =>
      expect(screen.queryByText("Waiting on you")).not.toBeInTheDocument()
    );
    expect(mocked.setWaitingOn).toHaveBeenCalledTimes(1);
  });
});


describe("ConversationsInbox — live ticket-list events", () => {
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

  /** The ticket-list callbacks the Inbox handed to useSignalR. */
  function capturedTicketCallbacks() {
    const mockUseSignalR = jest.mocked(useSignalR);
    const call = mockUseSignalR.mock.calls.at(-1);
    const onNewTicketAvailable = call?.[0]?.onNewTicketAvailable;
    const onTicketStatusChanged = call?.[0]?.onTicketStatusChanged;
    if (!onNewTicketAvailable || !onTicketStatusChanged) {
      throw new Error("useSignalR was not called with ticket-list callbacks");
    }
    return { onNewTicketAvailable, onTicketStatusChanged };
  }

  it("adds a newly-pushed ticket to the worklist without a refetch", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "existing", subject: "Existing convo" }),
    ]);

    render(<ConversationsInbox />);
    await screen.findByText("Existing convo");

    act(() => {
      capturedTicketCallbacks().onNewTicketAvailable(
        makeTicket({
          id: "pushed",
          subject: "Freshly pushed convo",
          status: "Claimed",
        })
      );
    });

    expect(await screen.findByText("Freshly pushed convo")).toBeInTheDocument();
    expect(screen.getByText("Existing convo")).toBeInTheDocument();
  });

  it("updates an existing ticket in place without duplicating its row", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", subject: "Original subject", status: "Claimed" }),
    ]);

    render(<ConversationsInbox />);
    await screen.findByText("Original subject");

    act(() => {
      capturedTicketCallbacks().onTicketStatusChanged(
        makeTicket({ id: "t-1", subject: "Updated subject", status: "Ongoing" })
      );
    });

    // The row is updated, not duplicated: exactly one conversation row remains.
    expect(await screen.findByText("Updated subject")).toBeInTheDocument();
    expect(screen.queryByText("Original subject")).not.toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  it("drops a ticket from the worklist when a pushed change reassigns it away", async () => {
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", subject: "Mine for now", status: "Ongoing" }),
    ]);

    render(<ConversationsInbox />);
    await screen.findByText("Mine for now");

    act(() => {
      // Reassigned to another agent — the Visibility Rule now excludes it.
      capturedTicketCallbacks().onTicketStatusChanged(
        makeTicket({ id: "t-1", subject: "Mine for now", assignedToId: "auth|noah" })
      );
    });

    await waitFor(() =>
      expect(screen.queryByText("Mine for now")).not.toBeInTheDocument()
    );
  });
});


describe("ConversationsInbox — URL-derived selection (no remount on navigate)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/conversations/inbox";
  });

  afterEach(() => {
    // Restore the default no-selection path so other suites are unaffected.
    mockPathname = "/conversations/inbox";
  });

  it("opens the conversation named in the URL when no selectedTicketId prop is given", async () => {
    // The inbox UI is now mounted by the shared layout with NO prop; the open
    // conversation is derived from the pathname instead. This proves selecting a
    // conversation (which only changes the URL) drives the open pane.
    mockPathname = "/conversations/inbox/t-1";
    mocked.list.mockResolvedValue([
      makeTicket({ id: "t-1", subject: "Cannot log in" }),
    ]);
    mocked.listMessages.mockResolvedValue([]);

    render(<ConversationsInbox />);

    // The right pane opens the URL's conversation (its message thread renders),
    // not the "No Conversation Selected" empty state.
    await waitFor(() =>
      expect(
        screen.queryByText(/No Conversation Selected/i)
      ).not.toBeInTheDocument()
    );
    expect(
      await screen.findByRole("log", { name: /message thread/i })
    ).toBeInTheDocument();
  });

  it("shows the empty state when the URL carries no conversation id", async () => {
    mockPathname = "/conversations/inbox";
    mocked.list.mockResolvedValue([]);

    render(<ConversationsInbox />);

    expect(
      await screen.findByText(/No Conversation Selected/i)
    ).toBeInTheDocument();
  });
});
