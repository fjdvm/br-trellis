"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { ContactTabs } from "@/components/features/contacts/ContactTabs";
import { ContactListTable } from "@/components/features/contacts/ContactListTable";
import { AddContactSheet } from "@/components/features/contacts/AddContactSheet";
import { Button } from "@/components/ui/button";
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
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div className="hidden sm:block">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Contacts
          </h1>
          <p className="text-body-md text-muted-foreground">
            View unified contact profiles and the source systems they are known from.
          </p>
        </div>
        <AddContactSheet onCreated={handleCreated} />
      </div>

      <ContactTabs active="contacts" />

      <Card className="shadow-none border-border flex flex-col">
        <CardHeader className="pb-md p-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md">
          <CardTitle className="text-title-lg font-bold">Contact registry</CardTitle>
          {isRefreshing && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent className="py-md pt-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
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
