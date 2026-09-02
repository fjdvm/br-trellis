# api-oos relays staff replies to web-shop by subscribing to api-crms's Conversation hub, not by polling

Status: accepted

## Context

A shop customer's live-agent chat shows staff replies only after a manual
refresh; web-crms shows them instantly. The two delivery paths differ:

- **web-crms** connects to api-crms's `ConversationHub` and receives each staff
  message the instant it is written (`MessageService` →
  `IConversationBroadcaster.BroadcastMessageAsync` pushes to the ticket group).
  Real-time push is the primary path; a 60s poll is only a dropped-push
  fallback.
- **web-shop** never touches api-crms. api-oos instead **polls** api-crms every
  ~3 seconds (`StaffReplyPollingService` → `StaffReplyRelayService` →
  `GET api/v1/conversations/{id}/messages`) for conversations currently
  registered active, and relays any staff messages down the web-shop `ChatHub`.

The poll relay is verified to work, but it is inherently ≤3s late and only
fires while a conversation is registered-active at a poll tick — fragile enough
that in practice a staff reply can miss the live path and surface only on
refresh. That is the reported bug.

## Decision

Replace api-oos's 3-second REST poll of api-crms with a **live subscription**:
api-oos connects to api-crms's `ConversationHub` as a trusted, authenticated
**server-to-server SignalR client**, subscribes to the ticket groups for its
active shop conversations, and forwards each staff message down the web-shop
`ChatHub` the moment it arrives. The web-shop browser still connects only to
api-oos's `ChatHub` and to nothing else.

## Why this is consistent with ADR 0002, not a departure

ADR 0002 ("CRMS is the integration receiver") and the "browser never talks to
api-crms directly" comments protect one specific boundary: the **untrusted shop
browser** must never reach api-crms. That principle is untouched here — the
browser's only endpoint is still api-oos's `ChatHub`.

api-oos is not the browser. It is already a trusted, server-side component that
calls api-crms directly today: the outbound Tickets/Ecommerce webhooks (ADR
0001/0002) and the ownership-verified ticket reads (ADR 0005) are all
api-oos → api-crms server-to-server calls over the shared `ApiCrms` client.
Subscribing to a hub instead of polling a REST endpoint is a **transport
upgrade within an already-established trust relationship**, not a new boundary
being opened. A future reader comparing this to ADR 0002 should read it as: the
receiver-boundary rule is about *who may originate traffic toward api-crms*
(trusted services yes, the browser no), not about *which transport* a trusted
service uses once it is inside that relationship.

It is also consistent with ADR 0004, which established that api-crms may host a
real-time hub for already-trusted, JWT-authenticated agent-side clients.
api-oos-as-relay joins that hub under the same bearer scheme web-crms uses — it
is another trusted hub client on the agent side of the boundary, relaying
onward to the customer side exactly as the existing poll already does.

## Considered Options

- **Faster poll (3s → ~1s)** — rejected as the primary fix. Cheaper, but still
  polling: still laggy, still fragile against the registered-active/tick race,
  and never truly real-time. Acceptable only as a temporary stopgap, not the
  destination.
- **Connect the web-shop browser to api-crms's hub directly** — rejected. This
  is the exact ADR 0002 violation the whole design exists to prevent: the
  untrusted browser reaching api-crms.
- **api-crms pushes to api-oos (api-crms as caller)** — rejected. api-crms must
  never originate outbound calls (ADR 0002, "the receiver never builds
  outward-reaching adapters"). Keeping api-oos as the initiating hub *client*
  preserves that: api-crms still only accepts inbound connections.

## Consequences

- api-oos needs a valid internal-auth-service token to connect to the
  `[Authorize]`-gated `ConversationHub` (passed as the `access_token`
  query-string value api-crms already lifts for the hub path). Today api-oos's
  REST calls to api-crms hit endpoints that are *not* `[Authorize]`, so no token
  was needed; the hub is authorized, so acquiring/refreshing a service token is
  new work this decision introduces. How api-oos obtains that token (a
  client-credentials grant, a dedicated relay service account, or another
  mechanism) is an open question for the spec — the OIDC provider currently
  advertises only `authorization_code`/`refresh_token`.
- The relay becomes push-driven. `StaffReplyRelayService`'s dedup/watermark and
  the `IChatSessionRegistry` active-set still matter (api-oos subscribes to the
  ticket groups for registered conversations and must still avoid double-relay),
  but the ~3s `PeriodicTimer` poll is removed as the delivery mechanism.
- A low-frequency fallback poll may be retained purely as a recovery path for a
  dropped hub connection (mirroring web-crms's 60s fallback), rather than as the
  primary transport.
- api-oos gains a dependency on api-crms's hub being reachable; connection
  drops must reconnect (SignalR automatic reconnect) and re-subscribe to active
  ticket groups, and fall back to the recovery poll while disconnected so no
  staff message is lost.
- The customer-facing contract is unchanged: web-shop still talks only to
  api-oos's `ChatHub`, receives the same `ReceiveMessage` events, and the
  single-key model of ADR 0006 (join/relay on the Ticket id) is unaffected.
