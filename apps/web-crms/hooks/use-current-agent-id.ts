"use client";

import { useSession } from "next-auth/react";

/**
 * Resolves the signed-in agent's identity — the single source of truth for
 * "who am I" across the ticket/conversation feature area (Claim, the Tickets
 * `assignedToMe` filter, the Conversations Inbox Visibility Rule, and staff
 * message authorship).
 *
 * The identity is the auth service's subject (`session.user.id`, the OIDC
 * `sub`), which internal-auth-service sets to the stable `ApplicationUser.Id`
 * — so it is constant across logins and a ticket claimed today keeps matching
 * "me" after I log out and back in. `session.user.username` (employee code) is
 * only a fallback for providers that emit one; internal-auth-service does not,
 * so in practice this resolves to the id. `null` when there is no session yet.
 *
 * Consolidating this here keeps the Claim write and the ownership-filter read
 * on the exact same value, so "what gets written on claim" always equals "what
 * gets compared on read".
 */
export function useCurrentAgentId(): string | null {
  const { data: session } = useSession();
  return session?.user?.id ?? session?.user?.username ?? null;
}
