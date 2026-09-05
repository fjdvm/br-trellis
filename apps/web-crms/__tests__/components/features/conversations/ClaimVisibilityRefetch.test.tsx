import { render, screen, waitFor, act } from "@testing-library/react";
import { ConversationsInbox } from "@/features/conversations/components/conversations-inbox";
import { TicketListPage } from "@/features/conversations/components/ticket-list-page";
import { conversationMessagesApi, conversationTicketsApi } from "@/features/conversations/services/conversations-api";
import type { TicketListItem } from "@/features/conversations/types";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/conversations/inbox",
}));

// Real-time hook is covered by its own test; mock it to a no-op here so the
// rendered ConversationsInbox doesn't open a live SignalR connection.
jest.mock("@/hooks/use-signal-r", () => ({
  useSignalR: jest.fn(),
}));

const AGENT_ID = "20be6bf7-f8cb-40e7-b29c-7f7f15d91aa3";

jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { id: AGENT_ID, name: "Alice SuperAdmin", email: "alice@trellis.io" } },
    status: "authenticated",
  }),
}));

jest.mock("@/features/conversations/services/conversations-api", () => ({
  conversationTicketsApi: {
      list: jest.fn(),
      getById: jest.fn(),
      claim: jest.fn(),
      changeStatus: jest.fn(),
      setWaitingOn: jest.fn(),
    },
  conversationMessagesApi: {
      listByTicket: jest.fn(),
      postStaffMessage: jest.fn(),
    }
}));

const mockedList = jest.mocked(conversationTicketsApi.list);
const mockedListMsgs = jest.mocked(conversationMessagesApi.listByTicket);

function claimedTicket(): TicketListItem {
  return {
    id: "t-claimed",
    subject: "Cannot access invoice download",
    status: "Claimed",
    waitingOn: "Agent",
    source: "Email",
    assignedToId: AGENT_ID, // exactly what the live claim stored
    assignedToName: "Alice SuperAdmin",
    assignedToEmail: "alice@trellis.io",
    contactId: "c-1",
    contact: { id: "c-1", name: "maya chen", email: "maya@acme.com" },
    createdAt: "2026-08-30T00:00:00Z",
    updatedAt: "2026-08-30T19:37:00Z",
  };
}

describe("Claim visibility — client refetch behavior (the real bug)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedListMsgs.mockResolvedValue([]);
  });

  it("PROOF the backend row passes the filters: a fresh load DOES show the claimed ticket", async () => {
    mockedList.mockResolvedValue([claimedTicket()]);
    render(<ConversationsInbox />);
    // Fresh mount + fetch → the live claimed row appears. Backend/filter are fine.
    expect(await screen.findByText("Maya Chen")).toBeInTheDocument();
  });

  it("Inbox refetches on window focus and surfaces a ticket claimed elsewhere", async () => {
    // BEFORE the claim: ticket is Unclaimed, so the Visibility Rule hides it.
    mockedList.mockResolvedValueOnce([
      { ...claimedTicket(), status: "Unclaimed", assignedToId: null, assignedToName: null },
    ]);

    render(<ConversationsInbox />);

    expect(
      await screen.findByText("Nothing to work on right now.")
    ).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledTimes(1);

    // A claim happens elsewhere; the next list() reflects the claimed row.
    mockedList.mockResolvedValueOnce([claimedTicket()]);

    // Returning to the tab fires window "focus" → the fix refetches.
    window.dispatchEvent(new Event("focus"));

    // The just-claimed ticket now appears without a manual page refresh.
    expect(await screen.findByText("Maya Chen")).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledTimes(2);
  });

  it("My Assigned refetches on window focus and surfaces a ticket claimed elsewhere", async () => {
    mockedList.mockResolvedValueOnce([
      { ...claimedTicket(), status: "Unclaimed", assignedToId: null, assignedToName: null },
    ]);

    render(
      <TicketListPage
        heading="My Assigned"
        cardTitle="Assigned to Me"
        assignedToMe
        showSourceFilter={false}
        showNewTicketButton={false}
        emptyMessage="No tickets are assigned to you."
      />
    );

    expect(
      await screen.findByText("No tickets are assigned to you.")
    ).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledTimes(1);

    mockedList.mockResolvedValueOnce([claimedTicket()]);
    await act(async () => {
      window.dispatchEvent(new Event("focus"));
    });

    expect(
      await screen.findByText("Cannot access invoice download")
    ).toBeInTheDocument();
    expect(mockedList).toHaveBeenCalledTimes(2);
  });
});
