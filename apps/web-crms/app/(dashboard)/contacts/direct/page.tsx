import { ContactListPage } from "@/components/features/contacts/ContactListPage";

/**
 * Contacts is a pre-filtered view of the shared Contact list: every Contact
 * with no confirmed ecommerce link, whether created directly in the CRM or
 * synced from another non-ecommerce source like POS. The slug is `/direct`
 * (not `/manual` or `/created`) because the bucket includes non-ecommerce
 * *synced* contacts, not only ones entered by hand. The origin filter is
 * applied in-memory over the fetched full list; Add Contact is hidden so users
 * aren't led into creating a contact from a filtered view. All props are
 * serializable, so this wrapper stays a Server Component.
 */
export default function Page() {
  return (
    <ContactListPage
      heading="Contacts"
      description="Contacts with no confirmed ecommerce link."
      sourceFilter="non-ecommerce"
      filterIndicatorLabel="Source: Non-Ecommerce"
      showAddButton={false}
    />
  );
}
