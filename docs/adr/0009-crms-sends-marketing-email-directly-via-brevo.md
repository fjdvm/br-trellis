# api-crms sends marketing Email Campaigns directly via Brevo — a scoped exception to ADR 0002/0007

Status: accepted (supersedes ADR 0008)

## Context

ADR 0008 made api-oos the sole initiator for Campaign dispatch, in order to stay consistent
with ADR 0002 ("CRMS is the integration receiver... never builds outward-reaching adapters")
and ADR 0007 ("api-crms must never originate outbound calls"). That shape shipped as #162
(dispatch) and #164 (open/click analytics): api-oos polls api-crms for due Email Campaigns,
sends them over its own Brevo SMTP relay, and relays dispatch results, opt-outs, and Brevo
webhook events back to api-crms server-to-server.

In practice this makes api-crms's most business-critical outbound capability — actually
reaching customers with marketing email — hostage to the uptime of a service (api-oos) whose
primary purpose (ecommerce/chat relay) is unrelated. If api-oos is down, degraded, or being
deployed, no marketing email goes out and no unsubscribe or analytics event is recorded, even
though nothing about *those* systems failed.

## Decision

api-crms sends marketing Email Campaigns directly to Brevo. Specifically:

- **Credentials**: api-crms gets its own independent `Brevo:*` SMTP configuration, separate
  from api-oos's. No cross-service credential-sharing mechanism is introduced.
- **Sending mechanism**: a new api-crms interface + implementation mirroring the structure of
  api-oos's `BrevoEmailSender` — an `SmtpClient` against Brevo's SMTP relay, not a new HTTP API
  client. Every send sets an `X-Mailin-Tag` SMTP header carrying the Campaign id, fixing a live
  gap in the shipped #164 implementation where no tag was ever set at send time, leaving the
  webhook's campaign-attribution logic unable to resolve anything in practice.
- **Dispatch trigger**: an internal sweep inside api-crms, extending the existing
  `CampaignLifecycleSweepService` pattern (already used for Banner/Popup `Active → Ended`), not
  a synchronous send inline on Launch. `SendNow` remains "due immediately," picked up on the
  next sweep tick — the model #162 already established, just relocated. A large recipient list
  sent inline inside the Launch request risks blocking/timing out with no durable
  partial-progress record; the sweep pattern already solves this elsewhere in this codebase.
- **Unsubscribe endpoint**: moves to api-crms as a new, unauthenticated, public-facing endpoint.
  api-oos no longer proxies it.
- **Analytics webhook**: Brevo's open/click webhook moves to api-crms as a new, unauthenticated,
  public-facing endpoint. api-oos no longer proxies it.
- api-oos's #162/#164 implementation — `CampaignDispatchClient`, `CampaignDispatchService`,
  `CampaignDispatchSweepService`, `MarketingController`, `BrevoWebhookController`, and
  `BrevoEmailSender.SendBulkAsync` — is deleted outright, not left dormant.

## Why this is a deliberate, scoped exception — not a general loosening of ADR 0002/0007

ADR 0002 and ADR 0007 are not being repealed. This exception applies to exactly one capability:
**sending marketing Email Campaigns via Brevo**, plus the two public endpoints that necessarily
travel with it (the unsubscribe link, the Brevo engagement webhook). It does not extend to any
other outbound integration, present or future. ADR 0008's own "Consequences" section anticipated
a future FB/IG/X channel and said "whichever trusted service owns that platform's credentials is
the one that reaches out — never api-crms itself"; that guidance still stands for anything other
than this one capability. A future reader must not treat this ADR as license to add other
outward-reaching adapters to api-crms by analogy — any other candidate clears its own bar and
gets its own ADR.

The reason for the exception is narrow: api-crms's email-sending must have zero dependency on
api-oos's uptime, even at the cost of a new outbound integration and duplicated Brevo
credentials. That is a deliberate trade — one more outbound adapter in api-crms, against
marketing send being held hostage to an unrelated service's availability.

## New precedent: api-crms's first public-facing surface

Every `AllowAnonymous` endpoint api-crms exposed before this decision (`/campaigns/due`,
`/dispatch-result`, `/events`, `/contacts/opt-out`) was anonymous only in the ASP.NET
auth-pipeline sense — reachable by trusted server-to-server callers, not by the public internet.
api-oos was the sole public-facing surface in this system.

The unsubscribe endpoint and the Brevo webhook are different in kind: real customers' mail
clients hit the unsubscribe link directly, and Brevo's own servers call the webhook directly,
both over the open internet. This is api-crms's first genuine public ingress — likely also a
hosting/network config change (api-crms's deployment must accept public internet traffic on
these two routes), not merely a code-level auth attribute.

These two endpoints require hardening no existing api-crms endpoint has needed: rate limiting,
input validation on every externally supplied field (email address, Brevo webhook payload
shape), and no error-message information leakage — e.g. the unsubscribe endpoint must keep
returning a generic confirmation regardless of whether the email matched a Contact, exactly as
the api-oos version did, not regress into a signal an attacker could use to enumerate Contacts.

## Considered Options

- **Keep unsubscribe/webhook in api-oos as thin proxies to api-crms's direct send** — rejected.
  This would leave the two things that matter most — compliance-critical unsubscribe,
  data-integrity-critical analytics attribution — still silently dependent on api-oos's uptime,
  a worse residual coupling than the one this redesign sets out to remove.
- **Share api-oos's existing Brevo credentials via a cross-service lookup** — rejected. No such
  mechanism exists in this repo today; building one reintroduces the cross-service coupling this
  redesign exists to eliminate.
- **Send synchronously inline on Launch** — rejected. Unbounded request duration for large
  recipient lists, no partial-progress durability; the sweep pattern already used elsewhere in
  this codebase solves this well.
- **Switch to Brevo's HTTP transactional-email API instead of SMTP** — rejected for now. Native
  `tags` support would also fix campaign attribution, but requires new `HttpClientFactory`
  registration and a JSON contract api-crms doesn't have today; the SMTP relay plus a
  `X-Mailin-Tag` header fixes the same gap with less new machinery, mirroring the proven
  `BrevoEmailSender` shape.

## Consequences

- api-crms gains its first outbound third-party integration and its first two public-facing,
  hardened endpoints — both explicitly scoped to marketing email only.
- api-oos loses all involvement in Email Campaigns; its #162/#164 scheduled-sweep, dispatch
  client, and Brevo webhook code is deleted rather than left dormant.
- Two independent Brevo credential sets now exist (api-oos's transactional-email SMTP
  credentials for account confirmation, api-crms's marketing SMTP credentials) — accepted
  duplication, not shared.
- api-crms's deployment needs to expose the unsubscribe and webhook routes to the public
  internet — an infra/ingress change, not only a code change — flagged for whoever owns
  provisioning.
- Any future outbound integration proposal for api-crms (Banner/Popup delivery, a future
  FB/IG/X channel, etc.) is **not** covered by this ADR and must clear its own bar under ADR
  0002/0007 as written.
