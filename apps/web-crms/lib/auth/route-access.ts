/**
 * Pure route → CRMS module-permission mapping used by the auth `authorized`
 * callback (wired as the app's proxy/middleware in `proxy.ts`).
 *
 * Kept dependency-free and side-effect-free so the "deny at the boundary"
 * decision is unit-testable without booting NextAuth, forging a JWT, or hitting
 * the network — the same "separate the policy decision from the transport"
 * principle the backend uses for its JWT/policy gating.
 *
 * The rule for a given pathname is one of:
 *  - `{ kind: "module", module }` — allowed iff `permissions.CRMS[module].canRead`
 *    is true (else deny → /access-denied).
 *  - `{ kind: "super-only" }` — allowed only for SuperUsers (else deny).
 *  - `{ kind: "open" }` — no module gate (authentication already enforced upstream).
 *
 * SuperUser bypass and the authenticated/unauthenticated handling live in the
 * `authorized` callback; this helper only answers "what does this path require?".
 */
export type RouteAccessRule =
  | { kind: "module"; module: string }
  | { kind: "super-only" }
  | { kind: "open" };

export function resolveRouteAccess(pathname: string): RouteAccessRule {
  // Order matters: more specific prefixes first (e.g. /contacts/segments before
  // a hypothetical broader /contacts rule).
  if (pathname === "/" || pathname.startsWith("/dashboard")) {
    return { kind: "module", module: "Dashboard" };
  }
  if (pathname.startsWith("/customers")) {
    return { kind: "module", module: "Customer Profiles" };
  }
  // Ticket lifecycle management (formerly /conversations/*) and the messenger
  // Conversations section both gate on the existing Conversations module — no
  // new module concept. Deny at the route, not just by hiding the sidebar link.
  if (pathname.startsWith("/tickets")) {
    return { kind: "module", module: "Conversations" };
  }
  if (pathname.startsWith("/conversations")) {
    return { kind: "module", module: "Conversations" };
  }
  if (pathname.startsWith("/campaigns")) {
    return { kind: "module", module: "Campaigns" };
  }
  // SuperAdmin/CEO-only or not-yet-permissioned sections: authenticated
  // non-super users are denied outright.
  if (pathname.startsWith("/settings")) {
    return { kind: "super-only" };
  }
  if (pathname.startsWith("/ecommerce")) {
    return { kind: "super-only" };
  }
  if (pathname.startsWith("/contacts/segments")) {
    return { kind: "super-only" };
  }
  return { kind: "open" };
}

/**
 * Given a resolved rule and the signed-in user's CRMS permission map, decide
 * whether an authenticated (non-super) user may view the route. SuperUsers are
 * handled by the caller and never reach here.
 */
export function isRouteAllowedForUser(
  rule: RouteAccessRule,
  crmsPerms: Record<string, { canRead?: boolean } | undefined> | undefined
): boolean {
  switch (rule.kind) {
    case "open":
      return true;
    case "super-only":
      return false;
    case "module":
      return crmsPerms?.[rule.module]?.canRead === true;
  }
}
