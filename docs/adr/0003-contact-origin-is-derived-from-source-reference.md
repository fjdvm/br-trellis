# Contact origin (Ecommerce vs. non-Ecommerce) is derived from SourceReference, not a stored field

Status: accepted

Splitting "All Contacts" into "Contacts" and "Ecommerce Contacts" sub-views
needs a way to classify a Contact's origin. `Ticket` has a precedent for
this shape — a stored `Source` enum, set once at creation — and that was
the obvious path to copy. We rejected it: a Contact's origin isn't fixed at
creation the way a Ticket's is. `ContactIdentityService.ResolveOrCreateContactAsync`
adds a *new* `SourceReference` to an *existing* Contact on a high-confidence
match, so a Contact created via POS (`SourceSystem = "pos"`) who later
places an ecommerce order under the same email genuinely acquires a second,
`"ecommerce"` `SourceReference` — it does not move from one fixed origin to
another. A single stored field can't represent that without either being
wrong for one of the two origins or requiring a migration/event nothing in
the system currently emits.

Instead, "Ecommerce Contact" is a derived condition, computed at read time:
a Contact has at least one active `SourceReference` with
`SourceSystem == "ecommerce"`. "Contacts" is the complement within All
Contacts (no `ecommerce` `SourceReference` — this also covers `pos`,
`crm-import`, and any other non-ecommerce `SourceSystem`, or none at all).
Ecommerce presence wins the merge case: once any `SourceReference` on a
Contact is `"ecommerce"`, that Contact counts as an Ecommerce Contact
regardless of what other sources also reference it.

## Considered Options

- **Stored `Contact.Source` enum, mirroring `TicketSource`** — rejected.
  Misrepresents the domain the moment a Contact picks up a second
  `SourceReference` from a different system; would need a write path
  (nothing currently updates it) and a migration for existing multi-source
  Contacts.

## Consequences

- Any query needing "is this Contact from Ecommerce" must join/filter
  through `SourceReference` (`SourceSystem == "ecommerce"`) rather than
  reading a single column — this is done client-side today (the Contacts
  list endpoint already returns `sourceReferences` per row), but a future
  server-side filter or report must apply the same join, not introduce a
  second, possibly-inconsistent stored flag.
- `SourceSystem` stays a free-text string (no enum), so this condition is
  a literal string match on `"ecommerce"` — if that literal ever needs to
  change or a second ecommerce-like integrator is added, this is the
  single place the rule lives.
