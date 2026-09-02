# Campaign dispatch and Banner/Popup delivery are api-oos-initiated, not api-crms-initiated

Status: accepted

## Context

The new Campaign module (Email/Banner/Popup marketing content) needs two things that cross
the api-crms/api-oos boundary: actually sending bulk email (Brevo lives entirely in api-oos;
api-crms owns Campaign data, Segments, and Contacts) and serving the currently-`Active`
Banner/Popup content to web-shop (which never talks to api-crms directly, per ADR 0005).

The naturally "obvious" shape — api-crms calls into api-oos to trigger a send once it decides
a Campaign is due — is exactly what ADR 0002 forbids: *"CRMS will never build a bespoke
outward-reaching adapter... CRMS is the integration receiver."* ADR 0007 restates this even
more directly: *"api-crms must never originate outbound calls."*

## Decision

api-oos remains the sole initiator on both fronts, mirroring the shape ADR 0007 already
established for the Conversation hub relay:

- **Email dispatch**: api-oos polls api-crms on a scheduled sweep (the same
  "scheduled sweep discovers due work" pattern already used for Cart abandonment detection
  and Workflow Run advancement) for due Campaigns, pulls the already-resolved recipient list
  and content, and performs the actual Brevo SMTP send. `SendNow` is not a separate
  synchronous path — it's a Campaign whose `nextRunAt` is already due, picked up on the next
  sweep tick exactly like a `Scheduled` send.
- **Banner/Popup delivery**: api-oos exposes the customer-facing read endpoints web-shop
  calls (`GET /api/banner/active`, `GET /api/popup/active`), fetching the currently-`Active`
  content from api-crms server-to-server, the same trusted-caller relationship already used
  for ownership-verified ticket reads (ADR 0005).

api-crms's own `Active → Ended` transition for an expired Banner/Popup window is handled by
api-crms's own internal sweep — an internal state update with no external effect, the same
way Cart abandonment detection runs entirely inside api-crms today. Only actions with an
external effect (sending an email, serving content to a browser-facing app) need to cross the
boundary, and only api-oos ever initiates that crossing.

## Considered Options

- **api-crms calls api-oos directly to trigger a send** — rejected outright: the literal
  violation ADR 0002/0007 exist to prevent.
- **api-oos subscribes to a push mechanism (a hub) instead of polling** — rejected here,
  unlike the Conversation relay in ADR 0007. Chat replies are latency-sensitive; a scheduled
  marketing send being picked up a sweep-interval late is not. A poll is the destination for
  this case, not a stopgap.

## Consequences

- api-crms needs a due-Campaigns read endpoint (recipients + content, pre-resolved at Launch
  per the Audience-snapshot decision) for api-oos to poll.
- api-oos gains a new scheduled sweep (reusing its existing sweep infrastructure) plus two new
  customer-facing read endpoints, both proxying api-crms data rather than owning it.
- A future FB/IG/X channel (deferred) would need to fit this same shape: api-crms holds the
  content, and whichever trusted service owns that platform's credentials is the one that
  reaches out — never api-crms itself.
