import {
  resolveConversationAccess,
  toChatMessages,
  type ConversationDetail,
  type ConversationFetchResult,
} from "@/lib/support/conversation-access";

function makeConversation(overrides: Partial<ConversationDetail> = {}): ConversationDetail {
  return {
    id: "t1",
    subject: "Late delivery",
    status: "Unclaimed",
    state: "open",
    messages: [
      { id: "m1", senderType: "Contact", content: "Where is my order?", sentAt: "2026-09-01T11:00:00.000Z" },
      {
        id: "m2",
        senderType: "Staff",
        senderStaffName: "Amelia",
        content: "Looking into it now.",
        sentAt: "2026-09-01T12:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

describe("resolveConversationAccess (pure render decision — #144/#145)", () => {
  it("maps a not-found fetch result to the not-found render outcome", () => {
    const result: ConversationFetchResult = { status: "not-found" };
    expect(resolveConversationAccess(result)).toEqual({ kind: "not-found" });
  });

  it("maps an ok 'open' result to render-conversation, carrying the conversation through", () => {
    const conversation = makeConversation({ state: "open" });
    const result: ConversationFetchResult = { status: "ok", conversation };

    expect(resolveConversationAccess(result)).toEqual({
      kind: "render-conversation",
      conversation,
    });
  });

  it("maps an ok 'awaiting-staff-reply' result to render-waiting (#145)", () => {
    const conversation = makeConversation({ state: "awaiting-staff-reply", messages: [] });
    const result: ConversationFetchResult = { status: "ok", conversation };

    expect(resolveConversationAccess(result)).toEqual({
      kind: "render-waiting",
      conversation,
    });
  });
});

describe("toChatMessages", () => {
  it("maps Staff -> agent and Contact -> user, preserving order and content", () => {
    const msgs = toChatMessages(makeConversation());

    expect(msgs).toHaveLength(2);
    expect(msgs[0]).toMatchObject({ id: "m1", senderType: "user", senderId: "user", content: "Where is my order?" });
    expect(msgs[1]).toMatchObject({
      id: "m2",
      senderType: "agent",
      senderId: "agent",
      senderName: "Amelia",
      content: "Looking into it now.",
    });
  });

  it("falls back to a generic agent name when a staff message has none", () => {
    const conversation = makeConversation({
      messages: [{ id: "m3", senderType: "Staff", content: "Hi", sentAt: "2026-09-01T13:00:00.000Z" }],
    });
    expect(toChatMessages(conversation)[0].senderName).toBe("Support Agent");
  });
});
