# Shop-chat conversation identity is the CRM Ticket id, not a separate thread id

Status: accepted

## Context

A shop-chat Conversation is reachable through api-crms by two different keys:

- its **CRM `Ticket.Id`** — used by the agent-facing reads
  `GET api/v1/tickets/{id}` and `GET api/v1/tickets/{id}/messages` (the
  web-shop profile ticket list, the ownership-verified detail read of
  ADR 0005, and the "has staff replied" gate), and
- its **`ExternalThreadId`** — the key ticket ingestion finds-or-creates on
  (`GetTicketByThreadIdAsync`) and the key the staff-reply polling loop reads
  through `GET api/v1/conversations/{conversationId}/messages`.

For shop chat these were two *unrelated* GUIDs for the same Conversation.
api-oos minted a throwaway `conversationId = Guid.NewGuid()` (in
`SupportWebhookController` for live chat, `SupportTicketService` for the
profile "Submit Ticket" flow), the browser cached it in `localStorage`, and
ingestion stored it as the ticket's `ExternalThreadId` — while the ticket got
its own, different `Ticket.Id`.

That split silently broke conversations. When a Contact re-entered a
Conversation from their profile, the detail page (`ConversationPage` →
`useChat`) joined the SignalR group and relayed outbound messages keyed on
the **`Ticket.Id`** it had been handed — but ingestion and the staff-reply
poll key on **`ExternalThreadId`**. The find-or-create missed, so the
customer's messages spawned a *second* ticket keyed on `Ticket.Id`, while
staff kept replying in the original ticket. Customer and agent ended up on
two different Tickets, each seeing only their own half; every message still
"succeeded" (persisted and echoed locally), so nothing surfaced the failure.
The `CrmTicketReader` even carries a comment warning that the two endpoints
key on different ids and must not be crossed — the footgun was known, just
not closed.

## Decision

For shop-chat Conversations, the CRM **`Ticket.Id` is the one and only
conversation identity**. `ExternalThreadId` for a shop-chat Ticket equals its
own `Ticket.Id`; api-oos never mints a separate throwaway conversationId, and
the browser joins the hub, relays messages, polls for staff replies, and
re-enters from the profile all under that same single key. The two api-crms
read surfaces (`/tickets/{id}` and `/conversations/{id}`) now resolve the same
Ticket for the same key, collapsing the dual namespace that allowed the split.

## Why email's `ExternalThreadId` stays independent (and this is not an inconsistency)

`ExternalThreadId` is deliberately kept as its own field, and email
ingestion keeps setting it to something *other* than `Ticket.Id`: an inbound
email carries its own externally-assigned thread id (the mail `ThreadId`),
and Trellis does not control it. Distinct emails must fold into one Ticket
by matching that upstream thread id, which exists before any Ticket does and
cannot be the Ticket's own id. Email's identity is assigned by the outside
world; shop chat's is not — api-oos is free to adopt the Ticket id as the
conversation key because it owns both ends of that exchange (ADR 0002:
api-crms receives, api-oos is the caller). So the asymmetry is intrinsic to
the two Sources, not an accident to be normalized away:

- **`Email`** → `ExternalThreadId` = the upstream mail thread id (independent
  of `Ticket.Id`, by necessity).
- **`Ecommerce`** (shop chat) → `ExternalThreadId` = `Ticket.Id` (one key,
  by decision).

`ExternalThreadId` therefore remains the general "how this Conversation is
keyed to its originating channel" field; only its *value policy* differs per
Source.

## Considered Options

- **Translate on re-entry** (have the profile detail read hand the browser
  the ticket's `ExternalThreadId` instead of `Ticket.Id`) — rejected. It
  fixes the one observed re-entry path but leaves two live keys and the
  documented "don't cross the endpoints" footgun in place for the next
  feature to trip over. This decision closes the namespace instead.
- **Automated merge of the already-split Tickets** — out of scope here. The
  historical split (e.g. Tickets `6D6687AC` / `9F7D9CA0`) is left as a known
  artifact; a human can reconcile manually if ever needed. An automated merge
  is a risky, hard-to-reverse data operation deserving its own design pass,
  not a side effect of this fix. We fix forward.

## Consequences

- api-oos stops minting a standalone shop-chat conversationId. The endpoint
  that currently returns a throwaway GUID must instead surface the canonical
  `Ticket.Id` (exact contract shape of `SupportWebhookController` /
  `SupportTicketService` to be settled during implementation — flagged if it
  proves larger than a response-field change).
- The staff-reply poll (`/conversations/{id}/messages`) and the agent reads
  (`/tickets/{id}`) resolve the same Ticket for a shop-chat key. api-crms may
  resolve a shop-chat conversation key by `Ticket.Id` (equivalently, by an
  `ExternalThreadId` that equals it).
- Email ingestion is untouched: it keeps its own upstream thread id, and this
  ADR must not be read as pushing email toward `Ticket.Id`.
- Stale `localStorage` conversation ids in already-open browsers point at the
  old key; they resolve to the fix-forward artifact, not the repaired path,
  until cleared. New conversations are correct from creation.
- Amends the identity assumptions of ADR 0004 (agent hub) and ADR 0005
  (customer conversation access via api-oos): both still hold, but the key a
  customer session joins/relays on is now the `Ticket.Id`, not a separate
  conversationId.
