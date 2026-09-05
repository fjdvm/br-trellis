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
import { contactsApi } from "@/features/contacts/services/contacts-api";
import { formatName, formatEmail } from "@/lib/format-display";
import { TableSkeleton } from "@/components/shared/TableSkeleton";
import { ScrollableTable } from "@/components/shared/ScrollableTable";
import {
  TablePagination,
  useClientPagination,
} from "@/components/shared/TablePagination";
import type { PendingReviewContact } from "@/features/contacts/types";

export function PendingReviewTable() {
  const [pendingReviews, setPendingReviews] = useState<PendingReviewContact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadPendingReviews() {
      try {
        const result = await contactsApi.listPendingReview();
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

  const reviewRows = pendingReviews.flatMap((review) =>
    review.candidates.map((candidate) => ({ review, candidate }))
  );
  const pagination = useClientPagination(reviewRows);

  if (isLoading) {
    return <TableSkeleton columns={4} />;
  }

  if (error) {
    return <div className="p-xl text-destructive">{error}</div>;
  }

  if (pendingReviews.length === 0) {
    return <div className="p-xl text-muted-foreground">No identity matches need review.</div>;
  }

  return (
    <>
      <ScrollableTable>
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
        <TableRow>
          <TableHead className="min-w-[180px]">New Contact</TableHead>
          <TableHead className="min-w-[200px]">Possible existing Contact</TableHead>
          <TableHead className="min-w-[120px]">Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagination.pageItems.map(({ review, candidate }) => (
          <TableRow key={`${review.contact.id}:${candidate.contact.id}`}>
            <TableCell className="font-medium">
              {formatName(review.contact.name) ?? "Unnamed contact"}
            </TableCell>
            <TableCell>
              <div className="font-medium">{formatName(candidate.contact.name) ?? "Unnamed contact"}</div>
              <div className="text-muted-foreground text-sm">
                {formatEmail(candidate.contact.email) ?? candidate.contact.phone ?? "—"}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">
                {Math.round(candidate.confidenceScore * 100)}% confidence
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
        </Table>
      </ScrollableTable>
      <TablePagination pagination={pagination} itemLabel="matches" />
    </>
  );
}
