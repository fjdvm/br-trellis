import React from "react";
import { Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import {
  TablePagination,
  useClientPagination,
} from "@/components/shared/TablePagination";
import { formatName, formatEmail } from "@/lib/format-display";
import type { CompanyContact } from "@/types/company";

export function CompanyContactsTable({ contacts }: { contacts: CompanyContact[] }) {

  const router = useRouter();
  const contactsPagination = useClientPagination(contacts);

  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-md p-lg">
        <CardTitle className="text-title-lg font-bold flex items-center gap-2">
          <Users className="w-5 h-5" />
          Contacts ({contacts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-lg pt-0">
        {contacts.length === 0 ? (
          <div className="p-xl text-muted-foreground">
            No contacts assigned to this company.
          </div>
        ) : (
          <>
            <ScrollableTable>
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[140px]">Name</TableHead>
                    <TableHead className="min-w-[180px]">Email</TableHead>
                    <TableHead className="min-w-[130px]">Phone</TableHead>
                    <TableHead className="min-w-[100px] text-right">LTV</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactsPagination.pageItems.map((contact) => (
                    <TableRow
                      key={contact.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                    >
                      <TableCell className="text-base font-medium">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="hover:underline text-primary"
                        >
                          {formatName(contact.name) ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell className="text-base">
                        {formatEmail(contact.email) ?? "—"}
                      </TableCell>
                      <TableCell className="text-base">
                        {contact.phone ?? "—"}
                      </TableCell>
                      <TableCell className="text-base text-right">
                        ${contact.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollableTable>
            <TablePagination pagination={contactsPagination} itemLabel="contacts" />
          </>
        )}
      </CardContent>
    </Card>
  );
}
