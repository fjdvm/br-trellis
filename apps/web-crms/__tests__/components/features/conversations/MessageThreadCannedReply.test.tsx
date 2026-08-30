import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageThread } from "@/components/features/conversations/MessageThread";
import { crmClient } from "@/lib/api/crm-client";
import type { ConversationMessage } from "@/types/conversation-message";
import type { CannedReplyListItem } from "@/types/canned-reply";

// The composer resolves {{agent_name}} from the session; keep it fixed here.
jest.mock("next-auth/react", () => ({
  useSession: () => ({
    data: {
      user: {
        id: "auth|amelia",
        name: "amelia ward",
        email: "amelia.ward@trellis.io",
      },
    },
    status: "authenticated",
  }),
}));

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    conversationMessages: {
      listByTicket: jest.fn(),
      postStaffMessage: jest.fn(),
    },
    cannedReplies: {
      list: jest.fn(),
    },
  },
}));

const mocked = {
  list: jest.mocked(crmClient.conversationMessages.listByTicket),
  post: jest.mocked(crmClient.conversationMessages.postStaffMessage),
  cannedList: jest.mocked(crmClient.cannedReplies.list),
};

beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
  }
  // jsdom lacks scrollIntoView on the Radix popover items; the picker uses it.
  if (!Element.prototype.scrollTo) {
    Element.prototype.scrollTo = () => {};
  }
});

function cannedReply(overrides: Partial<CannedReplyListItem> = {}): CannedReplyListItem {
  return {
    id: "cr-1",
    categoryId: "cat-1",
    categoryName: "Shipping",
    name: "Order status",
    body: "Hi {{customer_name}}, your ticket {{ticket_id}} — thanks, {{agent_name}}.",
    createdAt: "2025-01-15T00:00:00Z",
    deletedAt: null,
    ...overrides,
  };
}

const noop = () => {};

function renderThread(props: Partial<React.ComponentProps<typeof MessageThread>> = {}) {
  return render(
    <MessageThread
      ticketId="TicketId-42"
      contactName="jane doe"
      isTerminal={false}
      onMessageSent={noop}
      {...props}
    />
  );
}

describe("MessageThread (canned reply picker)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.list.mockResolvedValue([]);
    mocked.cannedList.mockResolvedValue([cannedReply()]);
  });

  async function openPicker(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole("button", { name: /Insert canned reply/i }));
    // Wait for the lazy crm-client import + list fetch to render items.
    await screen.findByText("Order status");
  }

  it("opens the picker, lists active replies grouped by category, and searches", async () => {
    mocked.cannedList.mockResolvedValue([
      cannedReply({ id: "cr-1", name: "Order status", categoryName: "Shipping" }),
      cannedReply({ id: "cr-2", name: "Refund policy", categoryName: "Refunds", body: "Refunds body" }),
    ]);
    const user = userEvent.setup();

    renderThread();
    await screen.findByText(/No messages yet/i);
    await openPicker(user);

    // Both categories and both replies visible.
    expect(screen.getByText("Shipping")).toBeInTheDocument();
    expect(screen.getByText("Refunds")).toBeInTheDocument();
    expect(screen.getByText("Refund policy")).toBeInTheDocument();

    // Search narrows the list.
    await user.type(screen.getByLabelText(/Search canned replies/i), "refund");
    await waitFor(() =>
      expect(screen.queryByText("Order status")).not.toBeInTheDocument()
    );
    expect(screen.getByText("Refund policy")).toBeInTheDocument();

    // Only active replies are ever requested (archived excluded).
    expect(mocked.cannedList).toHaveBeenCalledWith(false);
  });

  it("inserts a reply with variables substituted from composer data", async () => {
    const user = userEvent.setup();

    renderThread({ contactName: "jane doe" });
    await screen.findByText(/No messages yet/i);
    await openPicker(user);

    await user.click(screen.getByText("Order status"));

    // {{customer_name}} -> Jane Doe? No — substitution uses the raw contactName
    // ("jane doe"); title-casing is a display concern, not a substitution one.
    await waitFor(() =>
      expect(screen.getByLabelText("Reply")).toHaveValue(
        "Hi jane doe, your ticket TicketId-42 — thanks, amelia ward."
      )
    );
  });

  it("falls back to 'there' for {{customer_name}} on a contact-less ticket", async () => {
    const user = userEvent.setup();

    renderThread({ contactName: null });
    await screen.findByText(/No messages yet/i);
    await openPicker(user);

    await user.click(screen.getByText("Order status"));

    await waitFor(() =>
      expect(screen.getByLabelText("Reply")).toHaveValue(
        "Hi there, your ticket TicketId-42 — thanks, amelia ward."
      )
    );
  });

  it("inserts at the cursor without overwriting an existing draft", async () => {
    mocked.cannedList.mockResolvedValue([
      cannedReply({ body: "[TEMPLATE]" }),
    ]);
    const user = userEvent.setup();

    renderThread();
    await screen.findByText(/No messages yet/i);

    // Type a draft, then move the caret to the start.
    const box = screen.getByLabelText("Reply") as HTMLTextAreaElement;
    await user.type(box, "AB");
    box.setSelectionRange(1, 1); // caret between A and B

    await openPicker(user);
    await user.click(screen.getByText("Order status"));

    // Inserted between A and B — existing draft preserved around it.
    await waitFor(() => expect(box).toHaveValue("A[TEMPLATE]B"));
  });

  it("sends the fully-substituted text after insertion", async () => {
    mocked.post.mockResolvedValue({
      id: "s-1",
      ticketId: "TicketId-42",
      senderType: "Staff",
      senderContactId: null,
      senderStaffId: "auth|amelia",
      senderStaffName: "amelia ward",
      content: "sent",
      sentAt: "2025-01-15T11:00:00Z",
    });
    const user = userEvent.setup();

    renderThread({ contactName: "jane doe" });
    await screen.findByText(/No messages yet/i);
    await openPicker(user);
    await user.click(screen.getByText("Order status"));

    await waitFor(() =>
      expect(screen.getByLabelText("Reply")).toHaveValue(
        "Hi jane doe, your ticket TicketId-42 — thanks, amelia ward."
      )
    );

    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(mocked.post).toHaveBeenCalledWith("TicketId-42", {
        senderStaffId: "auth|amelia",
        senderStaffName: "amelia ward",
        content: "Hi jane doe, your ticket TicketId-42 — thanks, amelia ward.",
      })
    );
  });

  it("disables the picker on a terminal ticket", async () => {
    renderThread({ isTerminal: true });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Insert canned reply/i })).toBeDisabled()
    );
  });
});
