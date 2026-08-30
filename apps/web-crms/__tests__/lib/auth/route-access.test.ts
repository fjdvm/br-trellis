import {
  resolveRouteAccess,
  isRouteAllowedForUser,
} from "@/lib/auth/route-access";

describe("route-access policy (deny at the boundary)", () => {
  describe("resolveRouteAccess", () => {
    it("gates /tickets and its sub-routes on the Conversations module", () => {
      for (const p of [
        "/tickets",
        "/tickets/inbox",
        "/tickets/assigned",
        "/tickets/history",
        "/tickets/abc-123",
      ]) {
        expect(resolveRouteAccess(p)).toEqual({
          kind: "module",
          module: "Conversations",
        });
      }
    });

    it("gates /conversations and its sub-routes on the Conversations module", () => {
      for (const p of [
        "/conversations",
        "/conversations/inbox",
        "/conversations/inbox/abc-123",
        "/conversations/canned-replies",
      ]) {
        expect(resolveRouteAccess(p)).toEqual({
          kind: "module",
          module: "Conversations",
        });
      }
    });

    it("maps the other module routes as before", () => {
      expect(resolveRouteAccess("/")).toEqual({ kind: "module", module: "Dashboard" });
      expect(resolveRouteAccess("/dashboard")).toEqual({ kind: "module", module: "Dashboard" });
      expect(resolveRouteAccess("/customers/42")).toEqual({
        kind: "module",
        module: "Customer Profiles",
      });
      expect(resolveRouteAccess("/campaigns")).toEqual({ kind: "module", module: "Campaigns" });
    });

    it("marks super-admin-only sections as super-only", () => {
      for (const p of ["/settings", "/ecommerce", "/automation", "/contacts/segments"]) {
        expect(resolveRouteAccess(p)).toEqual({ kind: "super-only" });
      }
    });
  });

  describe("isRouteAllowedForUser — the actual deny decision", () => {
    const conversationsRule = { kind: "module", module: "Conversations" } as const;

    it("DENIES /tickets & /conversations when the user lacks Conversations.canRead", () => {
      // No Conversations entry at all.
      expect(isRouteAllowedForUser(conversationsRule, {})).toBe(false);
      // Present but canRead=false.
      expect(
        isRouteAllowedForUser(conversationsRule, { Conversations: { canRead: false } })
      ).toBe(false);
      // Undefined perms map (no permissions resolved).
      expect(isRouteAllowedForUser(conversationsRule, undefined)).toBe(false);
      // Has a DIFFERENT module but not Conversations.
      expect(
        isRouteAllowedForUser(conversationsRule, { Ecommerce: { canRead: true } })
      ).toBe(false);
    });

    it("ALLOWS /tickets & /conversations only when Conversations.canRead is true", () => {
      expect(
        isRouteAllowedForUser(conversationsRule, { Conversations: { canRead: true } })
      ).toBe(true);
    });

    it("always denies super-only routes for a regular (non-super) user", () => {
      // Even a user with every module flag set is denied a super-only route;
      // super users never reach this helper (handled in the callback).
      expect(
        isRouteAllowedForUser(
          { kind: "super-only" },
          { Conversations: { canRead: true }, Ecommerce: { canRead: true } }
        )
      ).toBe(false);
    });

    it("allows open routes without any permission", () => {
      expect(isRouteAllowedForUser({ kind: "open" }, undefined)).toBe(true);
    });
  });

  it("end-to-end: an authenticated user without Conversations.canRead is denied /tickets and /conversations", () => {
    const perms = { Dashboard: { canRead: true } }; // has dashboard, NOT conversations
    for (const path of ["/tickets", "/tickets/inbox", "/conversations", "/conversations/inbox/x"]) {
      const rule = resolveRouteAccess(path);
      expect(isRouteAllowedForUser(rule, perms)).toBe(false);
    }
    // Sanity: the same user CAN see the dashboard.
    expect(isRouteAllowedForUser(resolveRouteAccess("/dashboard"), perms)).toBe(true);
  });
});
