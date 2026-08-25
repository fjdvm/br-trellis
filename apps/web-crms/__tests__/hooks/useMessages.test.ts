import { renderHook, waitFor, act } from "@testing-library/react";
import { useMessages } from "@/hooks/useMessages";
import { crmClient } from "@/lib/api/crm-client";
import type { Message } from "@/types/message";

jest.mock("@/lib/api/crm-client", () => ({
  crmClient: {
    messages: {
      listByTicket: jest.fn(),
    },
  },
}));

const mockMessages: Message[] = [
  {
    id: "msg-1",
    senderId: "cust-1",
    senderName: "Olivia Vance",
    content: "Hi, I have a question.",
    isRead: true,
    sentAt: "2026-07-22T10:00:00Z",
  },
  {
    id: "msg-2",
    senderId: "staff-1",
    senderName: "Support Agent",
    content: "Hello! How can I help?",
    isRead: true,
    sentAt: "2026-07-22T10:05:00Z",
  },
];

describe("useMessages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("skips fetch when ticketId is null", () => {
    const { result } = renderHook(() => useMessages(null));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.messages).toEqual([]);
    expect(crmClient.messages.listByTicket).not.toHaveBeenCalled();
  });

  it("loads messages on mount when ticketId is provided", async () => {
    (crmClient.messages.listByTicket as jest.Mock).mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages("ticket-123"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.error).toBeNull();
    expect(crmClient.messages.listByTicket).toHaveBeenCalledWith("ticket-123");
  });

  it("sets error state when API request fails", async () => {
    (crmClient.messages.listByTicket as jest.Mock).mockRejectedValue(
      new Error("Failed to load messages")
    );
    const { result } = renderHook(() => useMessages("ticket-123"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBe("Failed to load messages");
    expect(result.current.messages).toEqual([]);
  });

  it("appends new message without making a network call", async () => {
    (crmClient.messages.listByTicket as jest.Mock).mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages("ticket-123"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const newMsg: Message = {
      id: "msg-3",
      senderId: "staff-1",
      senderName: "Support Agent",
      content: "Let me check for you.",
      isRead: true,
      sentAt: "2026-07-22T10:10:00Z",
    };

    act(() => {
      result.current.appendMessage(newMsg);
    });

    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2]).toEqual(newMsg);
    // Ensure no additional network call was made
    expect(crmClient.messages.listByTicket).toHaveBeenCalledTimes(1);
  });

  it("does not duplicate messages when appendMessage is called with an existing ID", async () => {
    (crmClient.messages.listByTicket as jest.Mock).mockResolvedValue(mockMessages);
    const { result } = renderHook(() => useMessages("ticket-123"));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.appendMessage(mockMessages[0]);
    });

    expect(result.current.messages).toHaveLength(2);
  });
});
