# Context

Glossary of domain terms for the Trellis CRM. This file is a glossary only —
no implementation details, no specs.

## Contact

The unified, canonical record for a person tracked by the system, synced
from ecommerce customer data and other sources. A Contact may or may not
have ever purchased anything — "Customer" is not a separate entity, it is a
lifecycle stage or Segment a Contact can belong to. A Contact carries a
marketing email opt-out flag, set via the unsubscribe link on a Campaign
email and honored whenever a Campaign's Audience is resolved (see Audience)
— distinct from any Conversation/support-email concern, which this flag
never affects.

## Company

An institutional buyer: an organization (e.g., a hotel) that multiple
Contacts (e.g., its staff) place orders on behalf of. A Contact belongs to
at most one Company at a time (the current affiliation, not a history of
past employers). A Company has a BuyerType (Institutional or Individual)
and an optional Primary Contact — the person to reach for that
organization, who must themself be a Contact of that same Company. Company
is a full CRUD record in its own right (create/edit/view/archive), same
tier as Contact, though deliberately thinner: no custom fields, no
Segments, no Timeline, no Orders of its own yet — Orders remain
attributed to a Contact only (see Order) until a future round attributes
them to a Company directly.

## Custom Field

A per-Contact property defined by the business, not hardcoded into the
Contact record. A Custom Field has a type: Text, Number, Date, Boolean, or
Single-select. Single-select Custom Fields have a fixed set of Options
(managed rows, not free text) that a Contact's value must reference.

## Segment

A named group of Contacts. A Segment is either:
- **Static** — explicit membership, contacts are added/removed manually.
- **Dynamic** — membership is computed live from a Rule (a flat list of
  conditions on Contact fields, custom fields, the Sentiment Score, LTV,
  or a related Product's `in_stock` status, combined with a single
  all-match/any-match toggle — no nested boolean logic in the current
  model).

A Segment marked system-defined cannot be deleted by users. "At-Risk
Customers" is a system-defined Dynamic Segment, not a special case in code —
it is a Rule like any other (Sentiment Score below a threshold).

## Sentiment Score

A denormalized numeric field on Contact, maintained by the Sentiment module
(not yet built). Exists on Contact today so Segment rules can reference it
before the Sentiment module exists.

## Timeline Entry

A denormalized, per-Contact record of something that happened elsewhere in
the system (an order, a conversation, a sentiment event, a content
interaction). Each producing module writes its own summary entries; the
Timeline is a read model, not a live join across modules — and it is a
narrative log, not a query surface for current state. Order status in
particular is never read from Timeline; it's read from the Order
projection directly (see Order). A new Order lifecycle event still writes
one Timeline Entry, for chronological context alongside other activity.

## Order

A purchase record owned by the ecommerce platform, not by Trellis. The
ecommerce platform is a custom-built system, owned and controlled by the
same team as Trellis — not a third-party SaaS (not Shopify, not
WooCommerce) — so the event contract between the two (event types, payload
shapes, delivery/retry guarantees, auth) is self-defined by this project,
not inherited from an external platform's docs. Purchases are one-time
only; there are no subscriptions in the current model. Trellis holds a
read-only, denormalized projection of each Order (synced in real time via
events) for display and calculation purposes — Trellis is never the system
of record for Orders and does not mutate them.

## Cart

An in-progress, not-yet-purchased selection of Products owned by the
ecommerce platform. Like Order, Trellis holds a read-only, synced
projection — same ownership pattern, but a Cart's projection is mutable
until it resolves (to an Order, or to Abandoned).

A Cart becomes **Abandoned** when: it has at least one item, the Contact
is identifiable (logged in, or an email was captured before drop-off), no
Order has been created from it, and it has received no activity for a
configurable inactivity threshold. Abandonment is a Trellis-owned business
rule (both the sweep interval and the inactivity threshold are
configurable), detected by a scheduled sweep over synced Cart projections
— not a status relayed from the ecommerce platform, and not itself
event-driven (there is no upstream event for "time has passed"). Detecting
Abandoned emits an internal event that the Workflow engine subscribes to.

## Product

An item owned by the ecommerce platform's catalog. Trellis holds a
read-only, synced projection — same ownership pattern as Order and Cart —
used to display order/cart contents and to make stock status (`in_stock`,
relayed as-is from the ecommerce platform, never recomputed by Trellis)
available as a filterable condition in Segment rules.

## Workflow

A configurable, reusable template of automated action for a business owner
to define without code changes: a Trigger (e.g., "Cart becomes Abandoned"),
an ordered list of Steps, and a Stop Condition. A Workflow is a definition
only — it does not itself track any in-progress execution; see Workflow
Run.

## Step

One unit within a Workflow's ordered sequence: a wait duration (may be
zero, for an immediate first action) paired with a single action (e.g.,
send an email). Wait and action are not modeled as separate steps — a
delay never exists independently of the action it precedes.

## Stop Condition

A Workflow-level check (not a Step-level one) evaluated after a Step's
wait elapses but before that Step's action executes. If met, the Workflow
Run stops immediately and no further Steps execute — e.g., "Contact
completed the purchase" stops an Abandoned Cart Workflow before it sends
another reminder. Checking after the wait but before the action is
deliberate: it prevents acting on a Contact who converted during the wait.

## Workflow Run

One in-progress or completed execution of a Workflow for a specific entity
(e.g., a Cart or Contact) — the instance, as distinct from the Workflow
definition/template it runs. Tracks which Workflow it belongs to, which
entity it's attached to, its current Step, its status (running / completed
/ stopped), and when its next Step is due. A scheduled sweep (the same
mechanism used for Cart abandonment detection) finds due Workflow Runs and
advances them — Workflow Run execution is not event-driven either.

## Customer Lifetime Value (LTV)

A denormalized numeric field on Contact: the sum of that Contact's
completed Order totals, minus the sum of any refunded amounts on those
Orders. Historical only — not a predictive/forward-looking estimate.
Recalculated whenever an Order projection relevant to that Contact changes
(created, updated, or refunded).

## Conversation

A single support interaction between a Contact and Trellis, tracked as a
Ticket with an ordered thread of Messages. A Conversation has two
independent fields, not one:

- **Status** — the ownership lifecycle: `Unclaimed → Claimed → Ongoing →
  Completed`, or `Canceled` from any non-terminal state. Tracks who owns
  the ticket and where it sits in the staff workflow.
- **WaitingOn** — `Agent`, `Customer`, or `None`: whose turn it is to
  respond. Orthogonal to Status — a `Claimed` or `Ongoing` ticket can be
  WaitingOn either party at different points in its life; Status alone
  never implies whose turn it is.

These are deliberately separate fields, not collapsed into a single enum
or a boolean bolted onto Status: Status answers "who owns this and is it
done," WaitingOn answers "who needs to act next." Conflating them would
require a transition table with a state for every combination, most of
which are the same ownership stage repeated with different waiting-sides.

A Conversation also has a **Source** — the channel through which it
originated: `Email` (arrived via inbound email ingestion), `Manual` (a
staff member opened it directly, with no external triggering event), or
`Ecommerce` (opened from the web-shop chat channel — the bot escalation /
live-agent widget and the profile "Submit Ticket" flow, relayed in
server-to-server via api-oos). Source is set once at creation and does not
change over a Conversation's life — unlike Status and WaitingOn, it isn't a
lifecycle field, just a fixed record of how the Conversation came to exist.

Each Conversation is keyed to its originating channel by an **External
Thread Id** — the stable identifier that groups inbound messages of one
channel exchange into a single Ticket. Its value policy differs by Source,
and the difference is intrinsic, not an inconsistency (see ADR 0006):

- For an `Email` Conversation it is the upstream mail thread id, assigned by
  the outside world and independent of the Ticket's own id — distinct emails
  fold into one Ticket by matching it, and it exists before any Ticket does.
- For an `Ecommerce` (shop-chat) Conversation it **equals the Ticket's own
  id**: shop chat's identity is not externally assigned, so the Ticket id is
  the single conversation key end to end (the browser joins, relays, polls
  for staff replies, and re-enters from the profile all under it). There is
  no separate shop-chat conversation id.
_Avoid_: treating the shop-chat conversation key and the Ticket id as two
different values — for `Ecommerce` they are the same id by decision
(ADR 0006). That is the distinction the `Email` case does *not* share.

A Conversation appears in an agent's personal Inbox only while they
actively own it: Status is `Claimed` or `Ongoing` and they are the
current assignee. Unclaimed, unassigned, and terminal (`Completed` /
`Canceled`) Conversations never appear in anyone's Inbox. This rule
governs presence in that per-agent worklist only — it is not an access
boundary; any agent with access to Conversations can still open a
Conversation's full message history regardless of who it's assigned to.
Dropping out of an Inbox (unclaiming, completing, canceling) never
deletes history — it belongs to the Ticket, not to any agent's session,
and reappears in full for whoever claims the ticket next.

On the Contact-facing side, access is a strict ownership boundary
rather than a workflow-visibility rule like the Inbox one above: a
Conversation is only ever reachable by the one Contact it belongs to,
identified by matching email — never by any other Contact, and never
anonymously. Within that boundary sits a second, independent gate: a
Conversation stays closed to its own Contact — unopenable, not merely
read-only — until at least one Staff message exists on it. A Contact's
own initial message (the one that created the Conversation) does not
satisfy this; only Staff-authored content does, and it satisfies the
gate regardless of Status (see above) — a Staff reply unlocks the
Conversation even if Status hasn't moved off `Unclaimed`.

## Canned Reply

A pre-written, reusable reply body agents can insert into a Conversation's
composer, organized into agent-managed Canned Reply Categories (e.g.
Shipping, Refunds, General). Both Categories and the Canned Replies within
them are shared/org-wide — there are no per-agent personal templates — and
are full CRUD records, following the same create/edit/archive convention
as Contact and Company. A Canned Reply body may contain Variable
placeholders (`{{customer_name}}`, `{{ticket_id}}`, `{{agent_name}}`)
resolved at the moment of insertion, using only data already available in
the composer at that point. This deliberately excludes any Order-linked
variable (e.g. an order number): no Order-to-Ticket or Order-to-Company
link exists in the current model (see Order), so a Canned Reply cannot
reference either. A Canned Reply Category cannot be archived while it
still contains any non-archived Canned Reply — its Canned Replies must be
moved or archived first.

## Identity Resolution

The process of matching an incoming record (from an external source system)
to an existing Contact, or creating a new one, based on email/phone/name
confidence matching. Produces a Source Reference (link from an external
system's record to a Contact) and, when confidence is ambiguous, a
Pending Review state requiring a human decision between match candidates.

## Campaign

A single record spanning one or more Channels (Email, Banner, Popup) that a
business owner defines to broadcast marketing content — the sole entity for
this concern; there is no separate "Post" entity. A Campaign carries
per-Channel content, a Schedule (`SendNow` or `Scheduled`), and an Audience
(see Audience, below). Status is `Draft → Active → Ended`: a Campaign only
becomes `Active` via a deliberate Launch action, separate from creation, and
only becomes `Ended` once every Channel it targets has individually reached a
terminal state — an Email leg that has already sent does not end a Campaign
whose Banner is still within its active window. In the UI, "Active Campaigns"
and "Published Posts" are both views over this same Campaign list, filtered by
status (`Active` and `Ended` respectively) — not distinct entities.

## Channel (Campaign)

One of `Email`, `Banner`, or `Popup` — the medium a Campaign's content is
delivered through. Banner (a persistent strip on the storefront homepage) and
Popup (a dismissible modal overlay) are modeled as two fully distinct
Channels, not sub-types of one "In-App" channel: they render differently and
carry different content fields. A Campaign can target more than one Channel
at once, each with independently authored content. At most one Banner
Campaign and one Popup Campaign may be `Active` at a time (one homepage slot
each) — a new one that would overlap an already-`Active` one of the same
Channel is blocked at creation, not silently superseded.

## Template

A pre-defined, reusable content skin for a Campaign Channel, curated by the
business/dev team — not user-authorable in the current model (no
drag-and-drop builder yet). A Template's content is tagged with a `format`
(`Html` today; `Blocks` reserved for a future block-based builder), keeping
the shape open to a structured, block-based representation later without a
rename or migration of existing Templates.

## Audience

Who an Email Campaign sends to: a Segment (see Segment) plus an optional list
of explicit email addresses for recipients outside the CRM entirely. The two
lists are deduplicated by normalized email address before sending, and any
Contact with a marketing opt-out on file is excluded regardless of Segment
membership. Audience only applies to the Email Channel — Banner and Popup
have no targeting concept; they broadcast to every storefront visitor for the
duration of their active window, since there is no reliable way to match an
anonymous visitor to a Segment at render time. A Campaign's Audience is
resolved once, at Launch (`Draft → Active`), not re-resolved at send time —
later Segment-membership changes don't affect an already-launched Campaign.
_Avoid_: treating Audience as its own persisted entity distinct from Segment
— it's a Segment reference (plus escape-hatch emails) captured on the
Campaign, not a new concept.

## Identity Handshake

A session-level gate on an anonymous chat channel: a visitor must supply an
identifying detail (typically an email) before sending any message — bot or
live-agent, no exceptions. Passing the Handshake only unlocks messaging and
triggers Identity Resolution against the supplied identifier; it does not by
itself guarantee a confident match. A visitor can pass the Handshake and
still land in Pending Review if Identity Resolution can't confidently match
or create a Contact. An already-authenticated customer skips the Handshake
entirely — their account email is used directly as the Identity Resolution
input.
_Avoid_: conflating with Identity Resolution — the Handshake is the UX gate
that precedes it; Identity Resolution is the matching operation itself.
