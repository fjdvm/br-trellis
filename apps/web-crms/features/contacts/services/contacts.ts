import type { ContactListItem } from "@/features/contacts/types";

/**
 * Which origin-slice of the Contacts list a screen shows. `"all"` is the
 * default (All Contacts — every row, unfiltered). `"ecommerce"` and
 * `"non-ecommerce"` are the two halves of the partition applied in-memory over
 * the already-fetched list; together they exhaustively and exclusively cover
 * every contact (see ADR 0003).
 */
export type ContactSourceFilter = "all" | "ecommerce" | "non-ecommerce";

/** The single place the "what counts as ecommerce" string literal lives. */
const ECOMMERCE_SOURCE_SYSTEM = "ecommerce";

/**
 * Derived origin classification: a Contact is an "Ecommerce Contact" iff it has
 * at least one source-link record whose `sourceSystem` case-insensitively
 * equals `"ecommerce"`. This is computed at read time from the Contact's live
 * set of `sourceReferences` rather than a stored field, so a Contact that
 * picked up an ecommerce link via an identity-resolution merge (e.g. a POS
 * contact who later ordered online) is correctly classified — ecommerce
 * presence wins regardless of what other sources also reference it.
 *
 * See ADR `0003-contact-origin-is-derived-from-source-reference`.
 */
export function isEcommerceContact(contact: ContactListItem): boolean {
  return contact.sourceReferences.some(
    (reference) =>
      reference.sourceSystem.trim().toLowerCase() === ECOMMERCE_SOURCE_SYSTEM
  );
}

/**
 * Apply a {@link ContactSourceFilter} as an in-memory pass over the full,
 * already-fetched contact list. `"non-ecommerce"` is deliberately the
 * *complement* of {@link isEcommerceContact} — it keeps POS-only, other
 * non-ecommerce-sourced, and source-less contacts alike — so `"ecommerce"` and
 * `"non-ecommerce"` partition the list with no overlap and no gap.
 */
export function filterContactsBySource(
  contacts: ContactListItem[],
  filter: ContactSourceFilter
): ContactListItem[] {
  switch (filter) {
    case "all":
      return contacts;
    case "ecommerce":
      return contacts.filter(isEcommerceContact);
    case "non-ecommerce":
      return contacts.filter((contact) => !isEcommerceContact(contact));
  }
}
