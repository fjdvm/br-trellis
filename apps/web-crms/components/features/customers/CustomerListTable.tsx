"use client";

import { useEffect, useState } from "react";
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
import { formatName, formatEmail } from "@/lib/format-display";
import type { CustomerIdentityListItem } from "@/types/customer";

export function CustomerListTable() {
  const [customers, setCustomers] = useState<CustomerIdentityListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadCustomers() {
      try {
        const result = await crmClient.customerIdentity.listCustomers();
        if (isCurrent) {
          setCustomers(result);
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadCustomers();
    return () => {
      isCurrent = false;
    };
  }, []);

  if (isLoading) {
    return <div className="p-xl text-muted-foreground">Loading customers…</div>;
  }

  if (error) {
    return <div className="p-xl text-destructive">{error}</div>;
  }

  if (customers.length === 0) {
    return <div className="p-xl text-muted-foreground">No customers found.</div>;
  }

  return (
    <div className="max-h-[600px] overflow-y-auto border border-border rounded-lg">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
        <TableRow>
          <TableHead className="min-w-[160px]">Customer</TableHead>
          <TableHead className="min-w-[180px]">Contact</TableHead>
          <TableHead className="min-w-[160px]">Known sources</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">
              {formatName(customer.name) ?? "Unnamed customer"}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {formatEmail(customer.email) ?? customer.phone ?? "—"}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-sm">
                {customer.sourceReferences.map((reference) => (
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
  );
}
