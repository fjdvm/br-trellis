# CRMS is the integration receiver; it never builds outward-reaching adapters

Status: accepted

Other internal systems (POS today, potentially SCMS or others later) are
owned by separate teams in separate repos — unlike the Ecommerce platform
(ADR 0001), where the same team controls both sides. We decided CRMS will
always be the *receiver* in these relationships: it publishes a stable,
generic webhook ingestion contract (same shape as ADR 0001's Ecommerce
contract — at-least-once delivery, HMAC-signed payloads, `event_id` dedup,
upsert-keyed projections) and waits for other systems to integrate toward
it. CRMS will never build a bespoke outward-reaching adapter that conforms
to another system's API to pull data in.

## Considered Options

- **CRMS builds a client/adapter per external system** (e.g., a POS API
  client that polls or calls into POS) — rejected. This inverts the
  dependency: CRMS would need to track and adapt to every integrator's own
  API shape and change cadence, and re-implement auth/retry/dedup logic
  per integrator instead of once. It also couples CRMS's release cycle to
  systems it doesn't own.

## Consequences

- The existing Ecommerce webhook contract (`api/v1/webhooks/ecommerce`,
  `EcommerceWebhookPayload`) stays Ecommerce-specific for now; it is not
  generalized preemptively. It will be generalized (e.g., a `Source`
  field on the payload envelope, a source-keyed secret/dispatch) only when
  a second real integrator (POS or otherwise) is an actual scheduled unit
  of work — not speculatively.
- Any future `Order.Source`/`Channel`-style discriminator must be a
  generic, receiver-side concept (a closed set of known integrators CRMS
  accepts events from), never integrator-specific logic living inside
  CRMS.
- Teams building POS, SCMS, or other systems are responsible for
  conforming their outbound events to CRMS's published contract — CRMS
  does not adjust its contract to match theirs.
