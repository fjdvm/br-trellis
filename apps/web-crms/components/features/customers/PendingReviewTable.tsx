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
import { formatName } from "@/lib/format-display";
import type { PendingReviewCustomer } from "@/types/customer";

export function PendingReviewTable() {
  const [pendingReviews, setPendingReviews] = useState<PendingReviewCustomer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadPendingReviews() {
      try {
        const result = await crmClient.customerIdentity.listPendingReviewCustomers();
        if (isCurrent) {
          setPendingReviews(result);
        }
      } catch (loadError) {
        if (isCurrent) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load pending reviews.");
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    void loadPendingReviews();
    return () => {
      isCurrent = false;
    };
  }, []);

  if (isLoading) {
    return <div className="p-xl text-muted-foreground">Loading pending reviews…</div>;
  }

  if (error) {
    return <div className="p-xl text-destructive">{error}</div>;
  }

  if (pendingReviews.length === 0) {
    return <div className="p-xl text-muted-foreground">No identity matches need review.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="min-w-[180px]">New Customer</TableHead>
          <TableHead className="min-w-[200px]">Possible existing Customer</TableHead>
          <TableHead className="min-w-[120px]">Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingReviews.flatMap((review) =>
          review.candidates.map((candidate) => (
            <TableRow key={`${review.customer.id}:${candidate.customer.id}`}>
              <TableCell className="font-medium">
                {formatName(review.customer.name) ?? "Unnamed customer"}
              </TableCell>
              <TableCell>
                <div className="font-medium">{formatName(candidate.customer.name) ?? "Unnamed customer"}</div>
                <div className="text-muted-foreground text-sm">
                  {candidate.customer.email ?? candidate.customer.phone ?? "—"}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {Math.round(candidate.confidenceScore * 100)}% confidence
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
