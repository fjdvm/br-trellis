"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { request } from "@/lib/api/request";

interface ContactLtvItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  lifetimeValue: number;
}

export function CustomerLtvPage() {
  const [contacts, setContacts] = useState<ContactLtvItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    try {
      const result = await request<ContactLtvItem[]>(`/api/v1/contacts`);
      setContacts(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load contact LTV data."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const sortedContacts = useMemo(
    () =>
      [...contacts].sort(
        (a, b) => (b.lifetimeValue ?? 0) - (a.lifetimeValue ?? 0)
      ),
    [contacts]
  );

  const formatCurrency = (value: number | undefined): string => {
    const amount = value ?? 0;
    return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-2xl max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Customer Lifetime Value
        </h1>
        <p className="text-body-md text-muted-foreground">
          Contacts ranked by lifetime value.
        </p>
      </div>

      <Card className="shadow-none border-border flex flex-col">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">
            LTV Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="py-md pt-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : sortedContacts.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              No contacts found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>LTV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedContacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell className="font-medium">
                      {contact.name ?? "Unnamed"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.email ?? "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(contact.lifetimeValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
