import { renderHook } from "@testing-library/react";
import { useSession } from "next-auth/react";
import { useCurrentAgentId } from "@/hooks/use-current-agent-id";

jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

const mockedUseSession = jest.mocked(useSession);

/**
 * The shared "who am I" resolver used by Claim, My Assigned, and the
 * Conversations Inbox Visibility Rule. It must resolve identity exactly the
 * way the Claim action already did: session user id first, username as a
 * fallback, and null when there is no session.
 */
describe("useCurrentAgentId", () => {
  function mockSession(user: { id?: string; username?: string } | null) {
    mockedUseSession.mockReturnValue({
      data: user ? { user } : null,
      status: user ? "authenticated" : "unauthenticated",
      update: jest.fn(),
    } as unknown as ReturnType<typeof useSession>);
  }

  it("resolves the session user id when present", () => {
    mockSession({ id: "auth|amelia", username: "amelia" });
    const { result } = renderHook(() => useCurrentAgentId());
    expect(result.current).toBe("auth|amelia");
  });

  it("falls back to the username when there is no id", () => {
    mockSession({ username: "amelia" });
    const { result } = renderHook(() => useCurrentAgentId());
    expect(result.current).toBe("amelia");
  });

  it("returns null when there is no session", () => {
    mockSession(null);
    const { result } = renderHook(() => useCurrentAgentId());
    expect(result.current).toBeNull();
  });

  it("returns null when the session has neither id nor username", () => {
    mockSession({});
    const { result } = renderHook(() => useCurrentAgentId());
    expect(result.current).toBeNull();
  });
});
