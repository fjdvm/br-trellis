"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { ContactListTable } from "@/components/features/contacts/ContactListTable";
import { AddContactSheet } from "@/components/features/contacts/AddContactSheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crmClient } from "@/lib/api/crm-client";
import { filterContactsBySource, type ContactSourceFilter } from "@/lib/contacts";
import type { ContactListItem } from "@/types/contact";

/**
 * Optional props that let a screen reuse this component as a pre-filtered
 * variant (e.g. the Contacts / Ecommerce Contacts screens) without forking it,
 * mirroring the shared-component-with-props pattern used for the Tickets
 * variants. Every prop is optional, so the default All Contacts screen renders
 * exactly as before when none are passed.
 */
export interface ContactListPageProps {
  /** Page heading override. Defaults to "All Contacts". */
  heading?: string;
  /** Sub-heading override. Defaults to the All Contacts description. */
  description?: string;
  /** Card title override. Defaults to "Contact registry". */
  cardTitle?: string;
  /**
   * Which origin-slice of the contact list to show. Applied as an in-memory
   * pass over the already-fetched full list — no new server-side query
   * parameter. Defaults to `"all"` (every contact, matching All Contacts).
   */
  sourceFilter?: ContactSourceFilter;
  /**
   * When supplied, renders a persistent, non-interactive badge in the card
   * header naming the active filter (e.g. "Source: Ecommerce"), with a dismiss
   * control that navigates back to `/contacts` (All Contacts). Omitted on the
   * All Contacts screen, which has no filter to indicate.
   */
  filterIndicatorLabel?: string;
  /**
   * Whether to render the "Add Contact" button. Defaults to `true` (the All
   * Contacts screen). The filtered variants pass `false`: creating a contact
   * from a filtered view it might not even appear in once created is
   * misleading, so Add Contact belongs on All Contacts only.
   */
  showAddButton?: boolean;
}

export function ContactListPage({
  heading = "All Contacts",
  description = "Unified contact profiles and source system origins.",
  cardTitle = "Contact registry",
  sourceFilter = "all",
  filterIndicatorLabel,
  showAddButton = true,
}: ContactListPageProps = {}) {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async (showRefreshSpinner = false) => {
    if (showRefreshSpinner) setIsRefreshing(true);
    try {
      const result = await crmClient.contacts.list();
      setContacts(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contacts.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const handleCreated = useCallback(() => {
    void loadContacts(true);
  }, [loadContacts]);

  // Apply the screen's origin filter in-memory over the fetched full list, so
  // the two filtered views are a clean partition of All Contacts.
  const visibleContacts = useMemo(
    () => filterContactsBySource(contacts, sourceFilter),
    [contacts, sourceFilter]
  );

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            {heading}
          </h1>
          <p className="text-body-md text-muted-foreground">{description}</p>
        </div>
        {showAddButton && <AddContactSheet onCreated={handleCreated} />}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg flex flex-row items-center justify-between">
          <div className="flex items-center gap-md">
            <CardTitle className="text-title-lg font-bold">{cardTitle}</CardTitle>
            {filterIndicatorLabel && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1"
                data-testid="contact-filter-indicator"
              >
                {filterIndicatorLabel}
                <button
                  type="button"
                  aria-label="Clear filter"
                  onClick={() => router.push("/contacts")}
                  className="ml-1 rounded-sm hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
          </div>
          {isRefreshing && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : (
            <ContactListTable contacts={visibleContacts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
