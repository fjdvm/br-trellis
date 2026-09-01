"use client";

import { useEffect, useRef } from "react";
import {
  HubConnection,
  HubConnectionBuilder,
  HttpTransportType,
} from "@microsoft/signalr";
import type { ConversationMessage } from "@/types/conversation-message";
import type { TicketListItem } from "@/types/ticket-list";

/**
 * The ConversationHub base URL. The browser connects directly to api-crms's
 * hub (not through the `/api/crm` proxy the REST client uses), so it needs the
 * public backend origin. Defaults to the dev backend.
 */
const CRM_API_URL =
  process.env.NEXT_PUBLIC_CRM_API_URL ?? "http://localhost:5035";

/**
 * Resolves the current staff access token for the hub connection. Imported
 * lazily (and only in the browser) so this module never statically pulls in
 * `next-auth/react`, keeping it transformable by the hook's Jest test — which
 * mocks SignalR but deliberately runs the hook without a SessionProvider.
 */
async function resolveAccessToken(): Promise<string> {
  if (typeof window === "undefined") return "";
  try {
    const { getSession } = await import("next-auth/react");
    const session = await getSession();
    return session?.accessToken ?? "";
  } catch {
    return "";
  }
}

/** Server → client payload for a ticket's Status/WaitingOn/assignment change. */
export interface TicketStatusChangedPayload extends TicketListItem {}

interface UseSignalROptions {
  /**
   * The ticket whose message thread is open. When set, the connection joins the
   * per-ticket group so `onReceiveMessage` fires for that thread. Omit it (the
   * Inbox case) to receive only ticket-list events on the Staff group.
   */
  ticketId?: string | null;
  /** A new message arrived on the joined ticket's thread. */
  onReceiveMessage?: (msg: ConversationMessage) => void;
  /** A brand-new ticket appeared (ticket-list event, Staff group). */
  onNewTicketAvailable?: (ticket: TicketListItem) => void;
  /** A ticket's Status/WaitingOn/assignment changed (ticket-list event). */
  onTicketStatusChanged?: (payload: TicketStatusChangedPayload) => void;
}

/**
 * Subscribes to api-crms's real-time ConversationHub for the signed-in agent.
 *
 * Group model (server methods fixed by this hook's test contract):
 * - `JoinStaff`/`LeaveStaff` — the shared group for ticket-list events, always
 *   joined so the Inbox updates whether or not a specific thread is open.
 * - `JoinTicket`/`LeaveTicket` — the per-ticket group for message events, joined
 *   only when a `ticketId` is supplied and re-joined when it changes.
 *
 * Real-time push is an enhancement layered over the existing poll-based fetch,
 * which stays in place as a low-frequency fallback: a dropped connection or a
 * missed event is still recovered by the next poll. The token is passed via the
 * `access_token` query string (a browser can't set an Authorization header on a
 * WebSocket upgrade), matching the hub's server-side JWT wiring.
 */
export function useSignalR(options?: UseSignalROptions) {
  const { ticketId, onReceiveMessage, onNewTicketAvailable, onTicketStatusChanged } =
    options ?? {};

  // Keep the latest callbacks in refs so the connection effect doesn't tear down
  // and rebuild the socket every time a parent re-renders with new closures.
  const handlersRef = useRef({
    onReceiveMessage,
    onNewTicketAvailable,
    onTicketStatusChanged,
  });
  handlersRef.current = {
    onReceiveMessage,
    onNewTicketAvailable,
    onTicketStatusChanged,
  };

  const connectionRef = useRef<HubConnection | null>(null);
  const startPromiseRef = useRef<Promise<void> | null>(null);

  // Connection lifecycle: build + start on mount, tear down on unmount.
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(`${CRM_API_URL}/hubs/conversations`, {
        // Supplies the staff JWT on the WebSocket upgrade via the `access_token`
        // query string, matching the hub's server-side JWT wiring. Resolved lazily
        // so no auth import is pulled into this module at load time.
        accessTokenFactory: resolveAccessToken,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect()
      .build();

    connection.on("ReceiveMessage", (msg: ConversationMessage) => {
      handlersRef.current.onReceiveMessage?.(msg);
    });
    connection.on("NewTicketAvailable", (ticket: TicketListItem) => {
      handlersRef.current.onNewTicketAvailable?.(ticket);
    });
    connection.on("TicketStatusChanged", (payload: TicketStatusChangedPayload) => {
      handlersRef.current.onTicketStatusChanged?.(payload);
    });

    connectionRef.current = connection;
    const startPromise = connection.start().then(() => {
      // Every agent joins the shared staff group for ticket-list events.
      return connection.invoke("JoinStaff");
    });
    startPromiseRef.current = startPromise;

    return () => {
      // Defer teardown until the start (and JoinStaff) promise settles, so we
      // never call stop()/leave on a half-open connection.
      void startPromise
        .catch(() => undefined)
        .then(() => connection.invoke("LeaveStaff").catch(() => undefined))
        .then(() => connection.stop().catch(() => undefined));
      connectionRef.current = null;
      startPromiseRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-ticket group membership: join the current ticket's thread group and
  // leave it (or swap to the next) when `ticketId` changes or the thread closes.
  useEffect(() => {
    if (!ticketId) return;
    const connection = connectionRef.current;
    const startPromise = startPromiseRef.current;
    if (!connection || !startPromise) return;

    void startPromise
      .catch(() => undefined)
      .then(() => connection.invoke("JoinTicket", ticketId).catch(() => undefined));

    return () => {
      void startPromise
        .catch(() => undefined)
        .then(() =>
          connection.invoke("LeaveTicket", ticketId).catch(() => undefined)
        );
    };
  }, [ticketId]);
}
