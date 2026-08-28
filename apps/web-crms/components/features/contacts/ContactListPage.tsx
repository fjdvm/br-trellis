"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { ContactListTable } from "@/components/features/contacts/ContactListTable";
import { AddContactSheet } from "@/components/features/contacts/AddContactSheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crmClient } from "@/lib/api/crm-client";
import type { ContactListItem } from "@/types/contact";

export function ContactListPage() {
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

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            All Contacts
          </h1>
          <p className="text-body-md text-muted-foreground">
            Unified contact profiles and source system origins.
          </p>
        </div>
        <AddContactSheet onCreated={handleCreated} />
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg flex flex-row items-center justify-between">
          <CardTitle className="text-title-lg font-bold">Contact registry</CardTitle>
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
            <ContactListTable contacts={contacts} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
