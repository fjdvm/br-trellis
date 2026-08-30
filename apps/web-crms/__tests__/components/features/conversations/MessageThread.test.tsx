import { render, screen, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageThread } from "@/components/features/conversations/MessageThread";
import { crmClient } from "@/lib/api/crm-client";
import type { ConversationMessage } from "@/types/conversation-message";

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
  },
}));

const mocked = {
  list: jest.mocked(crmClient.conversationMessages.listByTicket),
  post: jest.mocked(crmClient.conversationMessages.postStaffMessage),
};

// jsdom does not implement scrollIntoView, which the messenger layout calls to
// auto-scroll to the newest message. Polyfill it so those effects don't throw.
beforeAll(() => {
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

function makeMessage(
  overrides: Partial<ConversationMessage> = {}
): ConversationMessage {
  return {
    id: "m-1",
    ticketId: "t-1",
    senderType: "Contact",
    senderContactId: "c-1",
    senderStaffId: null,
    senderStaffName: null,
    content: "Hello there",
    sentAt: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

const noop = () => {};

function renderThread(props: Partial<React.ComponentProps<typeof MessageThread>> = {}) {
  return render(
    <MessageThread
      ticketId="t-1"
      contactName="jane doe"
      isTerminal={false}
      onMessageSent={noop}
      {...props}
    />
  );
}

describe("MessageThread (read path)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.list.mockResolvedValue([]);
  });

  it("renders fetched messages in the order returned by the API", async () => {
    mocked.list.mockResolvedValue([
      makeMessage({ id: "m-1", content: "First from customer", sentAt: "2025-01-15T10:00:00Z" }),
      makeMessage({
        id: "m-2",
        senderType: "Staff",
        senderContactId: null,
        senderStaffId: "auth|amelia",
        senderStaffName: "amelia ward",
        content: "Reply from staff",
        sentAt: "2025-01-15T10:05:00Z",
      }),
      makeMessage({ id: "m-3", content: "Second from customer", sentAt: "2025-01-15T10:10:00Z" }),
    ]);

    renderThread();

    const first = await screen.findByText("First from customer");
    const staff = screen.getByText("Reply from staff");
    const second = screen.getByText("Second from customer");

    // DOM order matches API order.
    expect(
      first.compareDocumentPosition(staff) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      staff.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it("distinguishes Staff and Contact messages visually (right vs left alignment)", async () => {
    mocked.list.mockResolvedValue([
      makeMessage({ id: "m-1", content: "Customer line" }),
      makeMessage({
        id: "m-2",
        senderType: "Staff",
        senderContactId: null,
        senderStaffId: "auth|amelia",
        senderStaffName: "amelia ward",
        content: "Staff line",
      }),
    ]);

    renderThread();

    const customerRow = (await screen.findByText("Customer line")).closest(
      '[class*="flex-row"]'
    );
    const staffRow = screen
      .getByText("Staff line")
      .closest('[class*="flex-row"]');

    // Staff group rows are reversed (avatar + bubbles pushed to the right);
    // Contact group rows are not.
    expect(staffRow?.className).toContain("flex-row-reverse");
    expect(customerRow?.className).not.toContain("flex-row-reverse");
  });

  it("labels a Contact message with the ticket's contact name regardless of senderContactId", async () => {
    // senderContactId is null (unlinked/anonymous origin) but the label still
    // uses the ticket's own contact name.
    mocked.list.mockResolvedValue([
      makeMessage({ senderContactId: null, content: "Anonymous-origin line" }),
    ]);

    renderThread({ contactName: "jane doe" });

    expect(await screen.findByText("Anonymous-origin line")).toBeInTheDocument();
    const viewport = screen.getByRole("log", { name: /message thread/i });
    expect(within(viewport).getByText("Jane Doe")).toBeInTheDocument();
  });

  it("falls back to 'Customer' when the ticket has no linked contact", async () => {
    mocked.list.mockResolvedValue([
      makeMessage({ content: "No linked contact line" }),
    ]);

    renderThread({ contactName: null });

    expect(await screen.findByText("No linked contact line")).toBeInTheDocument();
    expect(screen.getByText("Customer")).toBeInTheDocument();
  });

  it("labels a Staff message with senderStaffName", async () => {
    mocked.list.mockResolvedValue([
      makeMessage({
        id: "m-2",
        senderType: "Staff",
        senderContactId: null,
        senderStaffId: "auth|noah",
        senderStaffName: "noah patel",
        content: "Staff authored",
      }),
    ]);

    renderThread();

    expect(await screen.findByText("Staff authored")).toBeInTheDocument();
    expect(screen.getByText("Noah Patel")).toBeInTheDocument();
  });

  it("renders an empty state when there are no messages", async () => {
    mocked.list.mockResolvedValue([]);

    renderThread();

    expect(
      await screen.findByText(/No messages yet/i)
    ).toBeInTheDocument();
  });

  it("merges a new message surfaced by a later poll without dropping existing ones", async () => {
    jest.useFakeTimers();
    try {
      mocked.list.mockResolvedValueOnce([
        makeMessage({ id: "m-1", content: "Original message" }),
      ]);

      renderThread();

      // Initial fetch resolves.
      await screen.findByText("Original message");

      // A later poll returns the original plus a new message.
      mocked.list.mockResolvedValueOnce([
        makeMessage({ id: "m-1", content: "Original message" }),
        makeMessage({ id: "m-2", content: "New polled message", sentAt: "2025-01-15T10:20:00Z" }),
      ]);

      // Advance past the 10s poll interval and flush the pending promise.
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      await waitFor(() =>
        expect(screen.getByText("New polled message")).toBeInTheDocument()
      );
      // Existing message is still present and not duplicated.
      expect(screen.getAllByText("Original message")).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("MessageThread (reply box)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.list.mockResolvedValue([]);
  });

  function makeStaffResponse(content: string): ConversationMessage {
    return {
      id: "server-1",
      ticketId: "t-1",
      senderType: "Staff",
      senderContactId: null,
      senderStaffId: "auth|amelia",
      senderStaffName: "amelia ward",
      content,
      sentAt: "2025-01-15T11:00:00Z",
    };
  }

  it("sends a reply with the session's identity and drafted content", async () => {
    mocked.post.mockResolvedValue(makeStaffResponse("On my way"));
    const user = userEvent.setup();

    renderThread();

    await screen.findByText(/No messages yet/i);
    await user.type(screen.getByLabelText("Reply"), "On my way");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() =>
      expect(mocked.post).toHaveBeenCalledWith("t-1", {
        senderStaffId: "auth|amelia",
        senderStaffName: "amelia ward",
        content: "On my way",
      })
    );
  });

  it("optimistically appends the reply before the POST resolves", async () => {
    let resolvePost: (m: ConversationMessage) => void = () => {};
    mocked.post.mockReturnValue(
      new Promise<ConversationMessage>((r) => {
        resolvePost = r;
      })
    );
    const user = userEvent.setup();

    renderThread();

    await screen.findByText(/No messages yet/i);
    await user.type(screen.getByLabelText("Reply"), "Optimistic line");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    // Appears immediately, before the mocked POST resolves.
    expect(
      (await screen.findAllByText("Optimistic line")).length
    ).toBeGreaterThan(0);

    resolvePost(makeStaffResponse("Optimistic line"));
    await waitFor(() =>
      expect(screen.getAllByText("Optimistic line").length).toBeGreaterThan(0)
    );
  });

  it("rolls back the optimistic message, shows the error, and preserves the draft on failure", async () => {
    mocked.post.mockRejectedValue(new Error("Message content cannot be empty."));
    const user = userEvent.setup();

    renderThread();

    await screen.findByText(/No messages yet/i);
    await user.type(screen.getByLabelText("Reply"), "Doomed reply");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    // Error surfaced.
    expect(
      await screen.findByText("Message content cannot be empty.")
    ).toBeInTheDocument();
    // Optimistic message rolled back (empty state returns).
    await waitFor(() =>
      expect(screen.getByText(/No messages yet/i)).toBeInTheDocument()
    );
    // Draft preserved for retry.
    expect(screen.getByLabelText("Reply")).toHaveValue("Doomed reply");
  });

  it("blocks sending when the draft is empty or whitespace-only", async () => {
    const user = userEvent.setup();

    renderThread();

    await screen.findByText(/No messages yet/i);

    // Empty: button disabled.
    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled();

    // Whitespace-only: still disabled, no POST.
    await user.type(screen.getByLabelText("Reply"), "    ");
    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled();
    expect(mocked.post).not.toHaveBeenCalled();
  });

  it("disables the reply box but still renders the thread when the ticket is terminal", async () => {
    mocked.list.mockResolvedValue([
      makeMessage({ content: "History stays readable" }),
    ]);

    renderThread({ isTerminal: true });

    // Thread still renders.
    expect(await screen.findByText("History stays readable")).toBeInTheDocument();
    // Reply box disabled.
    expect(screen.getByLabelText("Reply")).toBeDisabled();
    expect(screen.getByRole("button", { name: /Send/ })).toBeDisabled();
  });

  it("invokes onMessageSent after a successful send", async () => {
    mocked.post.mockResolvedValue(makeStaffResponse("Done"));
    const onMessageSent = jest.fn();
    const user = userEvent.setup();

    renderThread({ onMessageSent });

    await screen.findByText(/No messages yet/i);
    await user.type(screen.getByLabelText("Reply"), "Done");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await waitFor(() => expect(onMessageSent).toHaveBeenCalledTimes(1));
    // Draft cleared on success.
    expect(screen.getByLabelText("Reply")).toHaveValue("");
  });

  it("does not invoke onMessageSent when the send fails", async () => {
    mocked.post.mockRejectedValue(new Error("boom"));
    const onMessageSent = jest.fn();
    const user = userEvent.setup();

    renderThread({ onMessageSent });

    await screen.findByText(/No messages yet/i);
    await user.type(screen.getByLabelText("Reply"), "Nope");
    await user.click(screen.getByRole("button", { name: /Send/ }));

    await screen.findByText("boom");
    expect(onMessageSent).not.toHaveBeenCalled();
  });

  it("does not let a poll inside the suppression window clobber a just-sent message", async () => {
    jest.useFakeTimers();
    try {
      mocked.list.mockResolvedValue([]);
      mocked.post.mockResolvedValue(makeStaffResponse("Just sent"));

      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

      renderThread();

      // Initial fetch resolves to an empty thread.
      await act(async () => {
        await Promise.resolve();
      });

      await user.type(screen.getByLabelText("Reply"), "Just sent");
      await user.click(screen.getByRole("button", { name: /Send/ }));

      await waitFor(() =>
        expect(screen.getAllByText("Just sent").length).toBeGreaterThan(0)
      );

      // A background poll fires within the 12s optimistic-suppression window
      // and would return the (still-empty) server list. It must be suppressed
      // so it can't wipe the just-sent message.
      mocked.list.mockResolvedValue([]);
      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      expect(screen.getAllByText("Just sent").length).toBeGreaterThan(0);
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("MessageThread (messenger layout)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.list.mockResolvedValue([]);
  });

  function staffMsg(
    id: string,
    content: string,
    sentAt: string,
    name = "amelia ward"
  ): ConversationMessage {
    return {
      id,
      ticketId: "t-1",
      senderType: "Staff",
      senderContactId: null,
      senderStaffId: "auth|amelia",
      senderStaffName: name,
      content,
      sentAt,
    };
  }

  function contactMsg(
    id: string,
    content: string,
    sentAt: string
  ): ConversationMessage {
    return {
      id,
      ticketId: "t-1",
      senderType: "Contact",
      senderContactId: "c-1",
      senderStaffId: null,
      senderStaffName: null,
      content,
      sentAt,
    };
  }

  it("renders an avatar with the sender's initials for each message group", async () => {
    mocked.list.mockResolvedValue([
      contactMsg("m-1", "Customer says hi", "2025-01-15T10:00:00Z"),
      staffMsg("m-2", "Agent replies", "2025-01-15T10:05:00Z"),
    ]);

    renderThread({ contactName: "jane doe" });

    await screen.findByText("Customer says hi");

    // Contact avatar initials from the ticket contact name (Jane Doe -> JD).
    expect(screen.getByText("JD")).toBeInTheDocument();
    // Staff avatar initials from the staff name (Amelia Ward -> AW).
    expect(screen.getByText("AW")).toBeInTheDocument();
  });

  it("falls back to a 'C' avatar for a Contact when the ticket has no linked contact", async () => {
    mocked.list.mockResolvedValue([
      contactMsg("m-1", "Anonymous line", "2025-01-15T10:00:00Z"),
    ]);

    renderThread({ contactName: null });

    await screen.findByText("Anonymous line");
    // "Customer" fallback -> single initial "C".
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("shows the sender name once per consecutive group, not per message", async () => {
    // Three consecutive Contact messages should show the contact name only once.
    mocked.list.mockResolvedValue([
      contactMsg("m-1", "First", "2025-01-15T10:00:00Z"),
      contactMsg("m-2", "Second", "2025-01-15T10:01:00Z"),
      contactMsg("m-3", "Third", "2025-01-15T10:02:00Z"),
    ]);

    renderThread({ contactName: "jane doe" });

    await screen.findByText("Third");

    // All three bubbles render.
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
    expect(screen.getByText("Third")).toBeInTheDocument();
    // But the sender name label appears exactly once for the group (within the
    // thread viewport — the card title also shows the customer name).
    const viewport = screen.getByRole("log", { name: /message thread/i });
    expect(within(viewport).getAllByText("Jane Doe")).toHaveLength(1);
  });

  it("starts a new group (new name label) when the sender changes", async () => {
    mocked.list.mockResolvedValue([
      contactMsg("m-1", "Customer line 1", "2025-01-15T10:00:00Z"),
      contactMsg("m-2", "Customer line 2", "2025-01-15T10:01:00Z"),
      staffMsg("m-3", "Staff line 1", "2025-01-15T10:02:00Z"),
      contactMsg("m-4", "Customer line 3", "2025-01-15T10:03:00Z"),
    ]);

    renderThread({ contactName: "jane doe" });

    await screen.findByText("Customer line 3");

    // Two separate Contact groups (first pair, then the trailing single) -> 2
    // labels within the thread viewport (the card title also shows the name).
    const viewport = screen.getByRole("log", { name: /message thread/i });
    expect(within(viewport).getAllByText("Jane Doe")).toHaveLength(2);
    // One Staff group.
    expect(within(viewport).getAllByText("Amelia Ward")).toHaveLength(1);
  });

  it("sends on Enter and inserts a newline on Shift+Enter", async () => {
    mocked.post.mockResolvedValue(staffMsg("s-1", "Enter send", "2025-01-15T11:00:00Z"));
    const user = userEvent.setup();

    renderThread();

    await screen.findByText(/No messages yet/i);
    const box = screen.getByLabelText("Reply");

    // Shift+Enter should NOT submit; it adds a newline.
    await user.type(box, "line one{Shift>}{Enter}{/Shift}line two");
    expect(mocked.post).not.toHaveBeenCalled();
    expect(box).toHaveValue("line one\nline two");

    // Plain Enter submits the drafted content.
    await user.type(box, "{Enter}");
    await waitFor(() =>
      expect(mocked.post).toHaveBeenCalledWith("t-1", {
        senderStaffId: "auth|amelia",
        senderStaffName: "amelia ward",
        content: "line one\nline two",
      })
    );
  });

  it("does not send on Enter when the ticket is terminal", async () => {
    mocked.list.mockResolvedValue([
      contactMsg("m-1", "closed thread", "2025-01-15T10:00:00Z"),
    ]);

    renderThread({ isTerminal: true });

    await screen.findByText("closed thread");
    // Textarea is disabled, so typing/Enter can't submit.
    const box = screen.getByLabelText("Reply");
    expect(box).toBeDisabled();
  });

  it("keeps the composer outside the scrollable message viewport", async () => {
    mocked.list.mockResolvedValue([
      contactMsg("m-1", "scrollable content", "2025-01-15T10:00:00Z"),
    ]);

    renderThread();

    await screen.findByText("scrollable content");

    const viewport = screen.getByRole("log", { name: /message thread/i });
    const replyBox = screen.getByLabelText("Reply");
    // The composer must NOT be nested inside the scroll viewport (it's pinned).
    expect(viewport.contains(replyBox)).toBe(false);
  });

  it("renders the message viewport as a height-constrained, vertically-scrollable region", async () => {
    mocked.list.mockResolvedValue([
      contactMsg("m-1", "scroll me", "2025-01-15T10:00:00Z"),
    ]);

    renderThread();

    await screen.findByText("scroll me");

    const viewport = screen.getByRole("log", { name: /message thread/i });
    // Vertical scrolling is enabled...
    expect(viewport.className).toContain("overflow-y-auto");
    // ...and the region is height-constrained so overflow actually scrolls
    // rather than growing the page infinitely.
    expect(viewport.className).toMatch(/\b(max-)?h-\[/);
  });
});

describe("MessageThread (title)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mocked.list.mockResolvedValue([]);
  });

  it("titles the thread with the customer's name when available", async () => {
    renderThread({ contactName: "jane doe", contactEmail: "jane@example.com" });

    // Title is the title-cased contact name, not the generic "Messages".
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.queryByText("Messages")).not.toBeInTheDocument();
  });

  it("falls back to the customer's email when there is no name", async () => {
    renderThread({ contactName: null, contactEmail: "JANE@EXAMPLE.COM" });

    // Email shown lowercased for display consistency.
    expect(await screen.findByText("jane@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Messages")).not.toBeInTheDocument();
  });

  it("falls back to 'Messages' when the ticket has no name or email", async () => {
    renderThread({ contactName: null, contactEmail: null });

    expect(await screen.findByText("Messages")).toBeInTheDocument();
  });
});
