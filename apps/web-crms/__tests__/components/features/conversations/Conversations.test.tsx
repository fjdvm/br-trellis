
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/conversations",
}));
jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { id: "auth|amelia", name: "Amelia Ward" } }, status: "authenticated" }),
}));
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ConversationsInbox as Conversations } from "@/features/conversations/components/conversations-inbox";
import { crmClient } from "@/lib/api/crm-client";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    conversationTickets: {
      list: jest.fn(),
      getById: jest.fn(),
      unclaim: jest.fn(),
      cancel: jest.fn(),
      updateStatus: jest.fn(),
    },
    tickets: {
      list: jest.fn(),
      getById: jest.fn(),
      unclaim: jest.fn(),
      cancel: jest.fn(),
      updateStatus: jest.fn(),
    },
    messages: {
      listByTicket: jest.fn(),
      create: jest.fn(),
      markRead: jest.fn(),
    },
    customers: {
      getById: jest.fn(),
      getMarketingHistory: jest.fn(),
      getOrders: jest.fn(),
    },
    templates: {
      list: jest.fn(),
    },
  },
}));

jest.mock("@/hooks/useSignalR", () => ({
  useSignalR: () => ({
    isConnected: true,
    sendMessage: jest.fn(),
  }),
}));

describe("Conversations", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (crmClient.conversationTickets.list as jest.Mock).mockResolvedValue([
      {
        id: "ticket-101",
        subject: "Account locked",
        status: "Ongoing",
        waitingOn: "Agent",
        assignedToId: "auth|amelia",
        contact: {
          id: "cust-1",
          name: "Charlie Brown",
          email: "charlie@example.com",
        },
        createdAt: "2026-08-01T10:00:00Z",
        updatedAt: "2026-08-01T10:05:00Z",
      },
    ]);

    (crmClient.tickets.getById as jest.Mock).mockResolvedValue({
      id: "ticket-101",
      title: "Account locked",
      description: "User cannot log in",
      status: "Ongoing",
      customerId: "cust-1",
      customerName: "Charlie Brown",
      createdAt: "2026-08-01T10:00:00Z",
      updatedAt: "2026-08-01T10:05:00Z",
    });

    (crmClient.messages.listByTicket as jest.Mock).mockResolvedValue([
      {
        id: "m-1",
        senderId: "cust-1",
        senderName: "Charlie Brown",
        content: "Please unlock my account",
        sentAt: "2026-08-01T10:05:00Z",
        isRead: false,
      },
    ]);

    (crmClient.customers.getById as jest.Mock).mockResolvedValue({
      id: "cust-1",
      name: "Charlie Brown",
      email: "charlie@example.com",
    });

    (crmClient.customers.getMarketingHistory as jest.Mock).mockResolvedValue({
      items: [],
      totalCount: 0,
    });

    (crmClient.customers.getOrders as jest.Mock).mockResolvedValue({
      items: [],
      totalCount: 0,
    });

    (crmClient.templates.list as jest.Mock).mockResolvedValue([
      { id: "tmpl-1", title: "Greeting", content: "Hello! How can I help you?" },
    ]);
  });

  it("renders the conversation screen and selects the first conversation", async () => {
    render(<Conversations />);

    await waitFor(() => {
      expect(screen.getByText("Inbox")).toBeInTheDocument();
      expect(screen.getAllByText("Charlie Brown").length).toBeGreaterThan(0);
    });
  });
});
