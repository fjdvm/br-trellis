"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Loader2, Users } from "lucide-react";
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
import { crmClient } from "@/lib/api/crm-client";
import type { SegmentListItem, SegmentMember } from "@/types/segment";

export function SegmentsListPage() {
  const [segments, setSegments] = useState<SegmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Membership view state
  const [selectedSegment, setSelectedSegment] = useState<SegmentListItem | null>(null);
  const [members, setMembers] = useState<SegmentMember[]>([]);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const loadSegments = useCallback(async () => {
    try {
      const result = await crmClient.segments.list();
      setSegments(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load segments.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSegments();
  }, [loadSegments]);

  const handleViewMembers = useCallback(async (segment: SegmentListItem) => {
    setSelectedSegment(segment);
    setIsMembersLoading(true);
    setMembersError(null);
    try {
      const result = await crmClient.segments.getMembers(segment.id);
      setMembers(result);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : "Unable to load members.");
    } finally {
      setIsMembersLoading(false);
    }
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedSegment(null);
    setMembers([]);
    setMembersError(null);
  }, []);

  // Membership view
  if (selectedSegment) {
    return (
      <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
        <div className="space-y-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="gap-1 -ml-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Segments
          </Button>
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
              <div className="flex items-center justify-center py-xl">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : membersError ? (
              <div className="p-xl text-destructive">{membersError}</div>
            ) : members.length === 0 ? (
              <div className="p-xl text-muted-foreground">No members in this segment.</div>
            ) : (
              <div className="max-h-[600px] overflow-y-auto border border-border rounded-lg">
                <Table className="table-fixed w-full">
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-1/4">Name</TableHead>
                      <TableHead className="w-1/4">Email</TableHead>
                      <TableHead className="w-1/4">Phone</TableHead>
                      <TableHead className="w-1/4">Lifetime Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="text-base font-medium">
                          {member.name ?? "Unnamed contact"}
                        </TableCell>
                        <TableCell className="text-base text-muted-foreground">
                          {member.email ?? "—"}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Segments list view
  return (
    <div className="w-full min-h-full py-xl px-lg md:px-xl space-y-lg max-w-7xl mx-auto">
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
            <div className="flex items-center justify-center py-xl">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : segments.length === 0 ? (
            <div className="p-xl text-muted-foreground">No segments found.</div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto border border-border rounded-lg">
              <Table className="table-fixed w-full">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-1/5">Name</TableHead>
                    <TableHead className="w-1/6">Type</TableHead>
                    <TableHead className="w-2/5">Rule</TableHead>
                    <TableHead className="w-1/6">Members</TableHead>
                    <TableHead className="w-1/10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {segments.map((segment) => (
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
