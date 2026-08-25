"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { crmClient } from "@/lib/api/crm-client";
import type { ContactListItem } from "@/types/contact";

export function ContactListTable() {
  const [contacts, setContacts] = useState<ContactListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadContacts() {
      try {
        const result = await crmClient.contacts.list();
        if (isCurrent) {
          setContacts(result);
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load contacts.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadContacts();
    return () => {
      isCurrent = false;
    };
  }, []);

  if (isLoading) {
    return <div className="p-xl text-muted-foreground">Loading contacts…</div>;
  }

  if (error) {
    return <div className="p-xl text-destructive">{error}</div>;
  }

  if (contacts.length === 0) {
    return <div className="p-xl text-muted-foreground">No contacts found.</div>;
  }

  return (
    <Table className="table-fixed w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="w-1/4">Contact</TableHead>
          <TableHead className="w-1/4">Email / Phone</TableHead>
          <TableHead className="w-1/4">Company</TableHead>
          <TableHead className="w-1/4">Known sources</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="font-medium">
              <Link href={`/contacts/${contact.id}`} className="hover:underline">
                {contact.name ?? "Unnamed contact"}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {contact.email ?? contact.phone ?? "—"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {contact.companyName ?? "—"}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-sm">
                {contact.sourceReferences.map((reference) => (
                  <Badge
                    key={`${reference.sourceSystem}:${reference.sourceId}`}
                    variant="outline"
                  >
                    {reference.sourceSystem} · {reference.sourceId}
                  </Badge>
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
