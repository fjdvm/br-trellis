"use client";

import { useSession } from "next-auth/react";

/**
 * Whether the signed-in agent may manage (create/edit/archive) Canned Replies
 * and their Categories — the first `canWrite`-style gate in the app.
 *
 * True when the session carries `permissions.CRMS.Conversations.canWrite === true`
 * or the user is a SuperUser (the same bypass applied everywhere else). Browsing
 * and inserting Canned Replies needs no permission beyond the existing
 * Conversations `canRead` gate that already governs this route, so this hook
 * only gates the management controls, never reading.
 *
 * NOTE: `Conversations.canWrite` is not actually grantable to any real user
 * until a companion seed-data change ships in the external internal-auth-service
 * (`br-auth-service`) repo. Until then only SuperUsers see the write controls.
 */
export function useConversationsCanWrite(): boolean {
  const { data: session } = useSession();
  if (session?.isSuperUser) return true;
  const crmsPerms = session?.permissions?.CRMS as
    | Record<string, Record<string, boolean>>
    | undefined;
  return crmsPerms?.Conversations?.canWrite === true;
}
