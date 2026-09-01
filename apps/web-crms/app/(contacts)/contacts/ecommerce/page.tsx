import { ContactListPage } from "@/components/features/contacts/ContactListPage";

/**
 * Ecommerce Contacts is a pre-filtered view of the shared Contact list: every
 * Contact with at least one confirmed ecommerce link. "Has an ecommerce link"
 * is derived from the Contact's live source-link records (see ADR 0003), so a
 * POS contact who later ordered online — now carrying both links — appears
 * here. The origin filter is applied in-memory over the fetched full list; Add
 * Contact is hidden so users aren't led into creating a contact from a filtered
 * view. All props are serializable, so this wrapper stays a Server Component.
 */
export default function Page() {
  return (
    <ContactListPage
      heading="Ecommerce Contacts"
      description="Contacts with at least one confirmed ecommerce link."
      sourceFilter="ecommerce"
      filterIndicatorLabel="Source: Ecommerce"
      showAddButton={false}
    />
  );
}
