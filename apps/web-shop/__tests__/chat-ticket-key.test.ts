import { chatTicketStorageKey, isUsableTicketId } from "@/lib/support/chat-ticket-key";

describe("chatTicketStorageKey", () => {
  it("keys the cache per user", () => {
    expect(chatTicketStorageKey("user-123")).toBe("br_chat_ticket_user-123");
  });
});

describe("isUsableTicketId (#150, ADR 0006 single-key)", () => {
  it("accepts a well-formed Guid ticket id", () => {
    expect(isUsableTicketId("226cf78b-655a-4927-9c6f-0087fe8dfee3")).toBe(true);
  });

  it("accepts a Guid regardless of case and surrounding whitespace", () => {
    expect(isUsableTicketId("  226CF78B-655A-4927-9C6F-0087FE8DFEE3  ")).toBe(true);
  });

  it("rejects a legacy non-Guid conversation key", () => {
    expect(isUsableTicketId("livetest-conv-1788355816")).toBe(false);
  });

  it("rejects empty, null, and undefined so a returning customer isn't stranded", () => {
    expect(isUsableTicketId("")).toBe(false);
    expect(isUsableTicketId(null)).toBe(false);
    expect(isUsableTicketId(undefined)).toBe(false);
  });

  it("rejects a nearly-Guid string (wrong shape)", () => {
    expect(isUsableTicketId("226cf78b-655a-4927-9c6f")).toBe(false);
  });
});
