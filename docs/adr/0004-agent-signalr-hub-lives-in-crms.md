# Real-time agent push is a SignalR hub hosted directly in api-crms

Status: accepted

Conversations needed real-time push so an agent sees a new customer message
instantly instead of on next refresh. api-oos's existing chat hub relays
customer traffic in from api-crms specifically because shop customers are
anonymous and untrusted — ADR 0002 ("CRMS is the integration receiver")
and the "browser never talks to api-crms directly" comments throughout
`ChatHub`/`StaffReplyRelayService` are both scoped to keeping that
untrusted, external-facing traffic off api-crms. Neither is a blanket rule
against api-crms hosting any real-time endpoint at all.

Agents are a different case: web-crms already connects directly to
api-crms's REST API as an authenticated staff client, under the same JWT
bearer scheme api-crms already terminates for its `Conversations*`
policies. A new hub in api-crms for agents is an extension of that
existing, already-trusted relationship, not a new external-facing surface
— so we host it there directly rather than mirroring the api-oos
relay-through-a-separate-service pattern. Relaying agent-facing events
through another service would just reintroduce the polling latency this
work exists to remove, for a trust boundary that doesn't apply to agents.

## Consequences

- The hub requires the same JWT bearer auth as the rest of api-crms's
  agent-facing API. It is not, and must not become, reachable by anonymous
  or customer-facing traffic — that boundary is exactly what stays intact
  from ADR 0002/api-oos's design.
- A future reader comparing this hub to api-oos's `ChatHub` should not read
  it as a violation of "CRMS never exposes itself to outward traffic" —
  the two hubs sit on opposite sides of the trust boundary that principle
  actually protects.
