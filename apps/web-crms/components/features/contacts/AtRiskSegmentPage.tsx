"use client";

import { useCallback, useEffect, useState } from "react";
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
import { crmClient } from "@/lib/api/crm-client";
import type { SegmentListItem, SegmentMember } from "@/types/segment";

export function AtRiskSegmentPage() {
  const [segment, setSegment] = useState<SegmentListItem | null>(null);
  const [members, setMembers] = useState<SegmentMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAtRiskSegment = useCallback(async () => {
    try {
      const segments = await crmClient.segments.list();
      const atRisk = segments.find(
        (s) => s.name === "At-Risk Customers" && s.isSystemDefined
      );
      if (!atRisk) {
        setError("At-Risk Customers segment not found.");
        return;
      }
      setSegment(atRisk);

      const segmentMembers = await crmClient.segments.getMembers(atRisk.id);
      setMembers(segmentMembers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load at-risk data."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAtRiskSegment();
  }, [loadAtRiskSegment]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-xl">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <div className="p-xl text-destructive">{error}</div>;
  }

  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          At-Risk Customers
        </h1>
        <p className="text-body-md text-muted-foreground">
          Contacts flagged by sentiment analysis as at-risk of churn.
          {segment && ` ${segment.memberCount} member${segment.memberCount !== 1 ? "s" : ""}.`}
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Members</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {members.length === 0 ? (
            <div className="p-xl text-muted-foreground">
              No at-risk contacts found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">LTV</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="text-base font-medium">
                      {member.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-base">
                      {member.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-base">
                      {member.phone ?? "—"}
                    </TableCell>
                    <TableCell className="text-base">
                      {member.companyName ?? "—"}
                    </TableCell>
                    <TableCell className="text-base text-right">
                      ${member.lifetimeValue.toLocaleString()}
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
