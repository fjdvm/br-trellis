"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ContactListItem } from "@/types/contact";

interface ContactListTableProps {
  contacts: ContactListItem[];
}

export function ContactListTable({ contacts }: ContactListTableProps) {
  const [search, setSearch] = useState("");

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const query = search.toLowerCase();
    return contacts.filter(
      (contact) =>
        contact.name?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.toLowerCase().includes(query) ||
        contact.companyName?.toLowerCase().includes(query)
    );
  }, [contacts, search]);

  if (contacts.length === 0) {
    return <div className="p-xl text-muted-foreground">No contacts found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredContacts.length === 0 ? (
        <div className="p-xl text-muted-foreground">No contacts match your search.</div>
      ) : (
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
            {filteredContacts.map((contact) => (
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
      )}
    </div>
  );
}
