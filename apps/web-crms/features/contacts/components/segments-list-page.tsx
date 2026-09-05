"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { segmentsApi } from "@/features/contacts/services/segments-api";
import { BackButton } from "@/components/shared/back-button";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import {
  TablePagination,
  useClientPagination,
} from "@/components/shared/table-pagination";
import { formatName, formatEmail } from "@/lib/format-display";
import type { SegmentListItem, SegmentMember } from "@/features/contacts/types";

interface SegmentsListPageProps {
  /** When provided, auto-selects the first system-defined segment matching this name */
  preSelectedSegmentName?: string;
  /** Back button navigation destination URL */
  backHref?: string;
  /** Page title override */
  title?: string;
  /** Description override */
  description?: string;
}

export function SegmentsListPage({
  preSelectedSegmentName,
  backHref = "/contacts",
  title = "Segments & Audiences",
  description = "Saved filters, dynamic rules, and system-defined audiences.",
}: SegmentsListPageProps = {}) {
  const router = useRouter();
  const [segments, setSegments] = useState<SegmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Membership view state
  const [selectedSegment, setSelectedSegment] = useState<SegmentListItem | null>(null);
  const [members, setMembers] = useState<SegmentMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const loadMembersForSegment = useCallback(async (segment: SegmentListItem) => {
    setSelectedSegment(segment);
    setIsMembersLoading(true);
    setMembersError(null);
    try {
      const result = await segmentsApi.getMembers(segment.id);
      setMembers(result);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : "Unable to load members.");
    } finally {
      setIsMembersLoading(false);
    }
  }, []);

  const loadSegments = useCallback(async () => {
    try {
      const result = await segmentsApi.list();
      setSegments(result);
      setError(null);

      // If preSelectedSegmentName is provided, auto-select that segment
      if (preSelectedSegmentName) {
        const target = result.find(
          (s) => s.name === preSelectedSegmentName && s.isSystemDefined
        );
        if (target) {
          void loadMembersForSegment(target);
        } else {
          setError(`Segment "${preSelectedSegmentName}" not found.`);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load segments.");
    } finally {
      setIsLoading(false);
    }
  }, [preSelectedSegmentName, loadMembersForSegment]);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  const handleViewMembers = useCallback(async (segment: SegmentListItem) => {
    void loadMembersForSegment(segment);
  }, [loadMembersForSegment]);

  const handleBackToList = useCallback(() => {
    setSelectedSegment(null);
    setMembers([]);
    setMembersError(null);
  }, []);

  const handleMemberClick = useCallback((member: SegmentMember) => {
    router.push(`/contacts/${member.id}`);
  }, [router]);

  const membersPagination = useClientPagination(members);
  const segmentsPagination = useClientPagination(segments);

  // Membership view
  if (selectedSegment) {
    return (
      <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
        <div className="space-y-sm">
          {preSelectedSegmentName ? (
            <BackButton fallbackHref="/contacts/segments" />
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToList}
              className="gap-1 -ml-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Segments
            </Button>
          )}
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            {selectedSegment.name}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {selectedSegment.type} segment · {selectedSegment.memberCount} member{selectedSegment.memberCount !== 1 ? "s" : ""}
          </p>
        </div>

        <Card className="shadow-none border-border">
          <CardHeader className="pb-md p-lg">
            <CardTitle className="text-title-lg font-bold">Members</CardTitle>
          </CardHeader>
          <CardContent className="p-lg pt-0">
            {isMembersLoading ? (
              <TableSkeleton columns={4} />
            ) : membersError ? (
              <div className="p-xl text-destructive">{membersError}</div>
            ) : members.length === 0 ? (
              <div className="p-xl text-muted-foreground">No members in this segment.</div>
            ) : (
              <>
                <ScrollableTable>
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[160px]">Name</TableHead>
                      <TableHead className="min-w-[180px]">Email</TableHead>
                      <TableHead className="min-w-[140px]">Phone</TableHead>
                      <TableHead className="min-w-[140px]">Lifetime Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersPagination.pageItems.map((member) => (
                      <TableRow
                        key={member.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleMemberClick(member)}
                      >
                        <TableCell className="text-base font-medium">
                          {formatName(member.name) ?? "Unnamed contact"}
                        </TableCell>
                        <TableCell className="text-base text-muted-foreground">
                          {formatEmail(member.email) ?? "—"}
                        </TableCell>
                        <TableCell className="text-base text-muted-foreground">
                          {member.phone ?? "—"}
                        </TableCell>
                        <TableCell className="text-base text-muted-foreground">
                          ${member.lifetimeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  </Table>
                </ScrollableTable>
                <TablePagination pagination={membersPagination} itemLabel="members" />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Segments list view
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg mx-auto">
      <div className="space-y-sm">
        <h1 className="text-headline-md font-bold tracking-tight text-foreground">
          Lists &amp; Segments
        </h1>
        <p className="text-body-md text-muted-foreground">
          Customer segments and groupings for targeting.
        </p>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Segments</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0">
          {isLoading ? (
            <TableSkeleton columns={4} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : segments.length === 0 ? (
            <div className="p-xl text-muted-foreground">No segments found.</div>
          ) : (
            <>
            <ScrollableTable>
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="min-w-[160px]">Name</TableHead>
                    <TableHead className="min-w-[100px]">Type</TableHead>
                    <TableHead className="min-w-[200px]">Rule</TableHead>
                    <TableHead className="min-w-[100px]">Members</TableHead>
                    <TableHead className="min-w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segmentsPagination.pageItems.map((segment) => (
                    <TableRow key={segment.id}>
                      <TableCell className="text-base font-medium">
                        {segment.name}
                        {segment.isSystemDefined && (
                          <Badge variant="secondary" className="ml-2">
                            System
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-base">
                        <Badge variant={segment.type === "Dynamic" ? "info" : "default"}>
                          {segment.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-sm">
                          {segment.rule ? (
                            <>
                              <Badge variant="outline">
                                {segment.rule.matchMode === "MatchAll" ? "All" : "Any"}
                              </Badge>
                              {segment.rule.conditions.map((condition, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {condition.field} {condition.operator} {condition.value}
                                </Badge>
                              ))}
                            </>
                          ) : (
                            <span className="text-sm text-muted-foreground">Manual membership</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-base">
                        {segment.memberCount}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleViewMembers(segment)}
                          title="View members"
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollableTable>
            <TablePagination pagination={segmentsPagination} itemLabel="segments" />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
