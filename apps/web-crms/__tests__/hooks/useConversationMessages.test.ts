import { renderHook, act, waitFor } from "@testing-library/react";
import { useConversationMessages } from "@/hooks/useConversationMessages";
import { crmClient } from "@/lib/api/crm-client";
import type { ConversationMessage } from "@/types/conversation-message";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    conversationMessages: {
      listByTicket: jest.fn(),
      postStaffMessage: jest.fn(),
    },
  },
}));

const listByTicket = crmClient.conversationMessages.listByTicket as jest.Mock;
const postStaffMessage = crmClient.conversationMessages.postStaffMessage as jest.Mock;

const SAVED_ID = "9a77b4e9-bed6-40b3-a476-b15fd9a06069";

function savedMessage(): ConversationMessage {
  return {
    id: SAVED_ID,
    ticketId: "t1",
    senderType: "Staff",
    senderContactId: null,
    senderStaffId: "agent-1",
    senderStaffName: "Amelia",
    content: "hello",
    sentAt: "2026-09-02T01:00:00.000Z",
  };
}

describe("useConversationMessages — optimistic send vs. racing live broadcast", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listByTicket.mockResolvedValue([]);
  });

  it("does not create a duplicate id when the saved message's broadcast arrives before the POST resolves", async () => {
    // Hold the POST open so we can inject the broadcast first (the race).
    let resolvePost!: (m: ConversationMessage) => void;
    postStaffMessage.mockReturnValue(
      new Promise<ConversationMessage>((resolve) => {
        resolvePost = resolve;
      })
    );

    const { result } = renderHook(() => useConversationMessages("t1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 1) Optimistic send (POST is pending).
    let sendPromise!: Promise<ConversationMessage>;
    act(() => {
      sendPromise = result.current.sendMessage({
        senderStaffId: "agent-1",
        senderStaffName: "Amelia",
        content: "hello",
      });
    });

    // 2) The hub broadcast of the SAME saved message arrives before the POST reply.
    act(() => {
      result.current.appendMessage(savedMessage());
    });

    // 3) Now the POST resolves with the saved message (would previously rename the
    //    temp entry to SAVED_ID, colliding with the broadcast copy).
    await act(async () => {
      resolvePost(savedMessage());
      await sendPromise;
    });

    const ids = result.current.messages.map((m) => m.id);
    const savedCount = ids.filter((id) => id === SAVED_ID).length;

    expect(savedCount).toBe(1);
    // No leftover temp entry either.
    expect(ids.some((id) => id.startsWith("temp-"))).toBe(false);
    // Every id is unique (the invariant the React key relies on).
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("appendMessage de-dupes an already-present id", async () => {
    listByTicket.mockResolvedValue([savedMessage()]);
    const { result } = renderHook(() => useConversationMessages("t1"));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.appendMessage(savedMessage());
    });

    expect(result.current.messages.filter((m) => m.id === SAVED_ID)).toHaveLength(1);
  });
});
