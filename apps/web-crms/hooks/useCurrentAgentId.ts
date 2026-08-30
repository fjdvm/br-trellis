"use client";

import { useSession } from "next-auth/react";

/**
 * Resolves the signed-in agent's identity — the single source of truth for
 * "who am I" across the ticket/conversation feature area.
 *
 * Identity resolution mirrors what the Claim action has always used: the
 * session user id first, falling back to the username, and `null` when there
 * is no session yet (an unauthenticated view owns no tickets). Consolidating
 * this here keeps the Tickets list's `assignedToMe` filter, the ticket detail
 * Claim action, and the Conversations Inbox Visibility Rule from diverging.
 */
export function useCurrentAgentId(): string | null {
  const { data: session } = useSession();
  return session?.user?.id ?? session?.user?.username ?? null;
}
