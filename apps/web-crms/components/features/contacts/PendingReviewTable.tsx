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
import type { PendingReviewContact } from "@/types/contact";

export function PendingReviewTable() {
  const [pendingReviews, setPendingReviews] = useState<PendingReviewContact[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    async function loadPendingReviews() {
      try {
        const result = await crmClient.contacts.listPendingReview();
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
          <TableHead className="min-w-[180px]">New Contact</TableHead>
          <TableHead className="min-w-[200px]">Possible existing Contact</TableHead>
          <TableHead className="min-w-[120px]">Confidence</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pendingReviews.flatMap((review) =>
          review.candidates.map((candidate) => (
            <TableRow key={`${review.contact.id}:${candidate.contact.id}`}>
              <TableCell className="font-medium">
                {review.contact.name ?? "Unnamed contact"}
              </TableCell>
              <TableCell>
                <div className="font-medium">{candidate.contact.name ?? "Unnamed contact"}</div>
                <div className="text-muted-foreground text-sm">
                  {candidate.contact.email ?? candidate.contact.phone ?? "—"}
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
