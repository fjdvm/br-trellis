# Context

Glossary of domain terms for the Trellis CRM. This file is a glossary only —
no implementation details, no specs.

## Contact

The unified, canonical record for a person tracked by the system, synced
from ecommerce customer data and other sources. A Contact may or may not
have ever purchased anything — "Customer" is not a separate entity, it is a
lifecycle stage or Segment a Contact can belong to.

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
`Ecommerce` (reserved for a future ecommerce-initiated ticket path; no
Conversation is created this way yet). Source is set once at creation
and does not change over a Conversation's life — unlike Status and
WaitingOn, it isn't a lifecycle field, just a fixed record of how the
Conversation came to exist.

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

## Identity Resolution

The process of matching an incoming record (from an external source system)
to an existing Contact, or creating a new one, based on email/phone/name
confidence matching. Produces a Source Reference (link from an external
system's record to a Contact) and, when confidence is ambiguous, a
Pending Review state requiring a human decision between match candidates.
