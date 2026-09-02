# Customer-facing Conversation access is verified by api-oos, not left to the page

Status: accepted

web-shop's ticket-detail fetch pointed at a route that never existed (a
silent 404), and no layer anywhere — page, middleware, or API — ever
verified that a visitor requesting a given Ticket ID was actually its
owning Contact; anyone who had (or guessed) a Ticket's GUID could read it,
and post to it via `ChatHub`, regardless of whose it was. Fixing the dead
endpoint was the moment to close that gap rather than patch around it.

The real read endpoint lives in api-oos, not api-crms: web-shop keeps
talking only to api-oos, which verifies the caller's authenticated email
against the Conversation's Contact before returning anything, then reaches
into api-crms server-to-server — the same boundary ADR 0004 already
established for `ChatHub`, extended to ticket reads. A Ticket ID that
exists but isn't the caller's returns 404, never a distinguishable
"forbidden," so probing IDs can't confirm which ones are valid. Both this
ownership check and the Staff-reply gate (see `CONTEXT.md`, Conversation)
are enforced server-side before the page renders — a Server Component
check, not a client-side redirect — matching web-crms's existing
"deny at the route, not by hiding UI" precedent.

## Consequences

- Anonymous viewing of a specific Ticket is no longer possible at all;
  `/support/*` now requires an authenticated session with no exceptions.
- A Contact with no email on file can never be matched as a Conversation's
  owner, so such a Conversation becomes unreachable to any customer
  session — acceptable, since that can only arise from an upstream data
  gap, not a normal flow.
- The Staff-reply gate is enforced server-side in the same api-oos read:
  a Conversation with no Staff-authored Message is returned to its owner as
  a "waiting" state carrying the ticket's subject/status only, with no
  message data — so the thread itself is never sent to the client until the
  gate opens. The page renders that waiting state (no thread, no input) and
  auto-transitions to the full Conversation the moment a Staff message
  arrives over the existing per-ticket SignalR group.
