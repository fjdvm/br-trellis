"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, Column } from "@/components/shared/DataTable";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { request } from "@/lib/api/request";
import { formatName, formatEmail } from "@/lib/format-display";
import { useEcommerceSyncStatus } from "@/features/ecommerce/hooks/useEcommerceSyncStatus";
import { EcommerceConnectPrompt } from "./ecommerce-connect-prompt";

interface ContactLtvItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  lifetimeValue: number;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const columns: Column<ContactLtvItem>[] = [
  {
    header: "Name",
    className: "min-w-[160px]",
    cell: (row) => <span className="font-medium">{formatName(row.name) ?? "Unnamed"}</span>,
  },
  {
    header: "Email",
    className: "min-w-[200px]",
    cell: (row) => (
      <span className="text-muted-foreground">{formatEmail(row.email) ?? "\u2014"}</span>
    ),
  },
  {
    header: "Lifetime Value",
    className: "min-w-[140px]",
    cell: (row) => (
      <span className="font-medium">{formatCurrency(row.lifetimeValue ?? 0)}</span>
    ),
  },
];

function searchContacts(contact: ContactLtvItem, query: string): boolean {
  return (
    (contact.name?.toLowerCase().includes(query) ?? false) ||
    (contact.email?.toLowerCase().includes(query) ?? false)
  );
}

export function CustomerLtvPage() {
  const { status: syncState, isLoading: syncLoading } = useEcommerceSyncStatus();
  const [contacts, setContacts] = useState<ContactLtvItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      const result = await request<ContactLtvItem[]>(`/api/v1/contacts`);
      setContacts(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load contacts.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const sortedContacts = useMemo(
    () => [...contacts].sort((a, b) => (b.lifetimeValue ?? 0) - (a.lifetimeValue ?? 0)),
    [contacts]
  );

  if (!syncLoading && syncState === "never_connected") {
    return <EcommerceConnectPrompt />;
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Customer Lifetime Value
        </h1>
        <p className="text-body-md text-muted-foreground">
          Contacts ranked by lifetime value (completed orders net of refunds).
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">LTV Rankings</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <TableSkeleton columns={5} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : (
            <DataTable
              data={sortedContacts}
              columns={columns}
              searchPlaceholder="Search contacts&#x2026;"
              searchFn={searchContacts}
              emptyMessage="No contacts found."
              getRowKey={(row) => row.id}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
