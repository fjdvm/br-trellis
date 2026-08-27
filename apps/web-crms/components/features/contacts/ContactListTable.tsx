"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatName, formatEmail } from "@/lib/format-display";
import type { ContactListItem } from "@/types/contact";

const PAGE_SIZE = 20;

interface ContactListTableProps {
  contacts: ContactListItem[];
}

export function ContactListTable({ contacts }: ContactListTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

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
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredContacts.length === 0 ? (
        <div className="p-xl text-muted-foreground">No contacts match your search.</div>
      ) : (
        <>
          <div className="max-h-[600px] overflow-y-auto border border-border rounded-lg">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="min-w-[160px]">Contact</TableHead>
                  <TableHead className="min-w-[180px]">Email / Phone</TableHead>
                  <TableHead className="min-w-[140px]">Company</TableHead>
                  <TableHead className="min-w-[160px]">Known sources</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedContacts.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/contacts/${contact.id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link href={`/contacts/${contact.id}`} className="hover:underline">
                        {formatName(contact.name) ?? "Unnamed contact"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatEmail(contact.email) ?? contact.phone ?? "—"}
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
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredContacts.length)} of {filteredContacts.length} contacts
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
