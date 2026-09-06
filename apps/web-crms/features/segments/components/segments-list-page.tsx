"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, MoreVertical } from "lucide-react";
import { TableSkeleton } from "@/components/shared/table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { segmentsApi } from "../services/segments-api";
import { BackButton } from "@/components/shared/back-button";
import { ScrollableTable } from "@/components/shared/scrollable-table";
import {
  TablePagination,
  useClientPagination,
} from "@/components/shared/table-pagination";
import { formatName, formatEmail } from "@/lib/format-display";
import { NewSegmentSheet } from "./new-segment-sheet";
import type { SegmentListItem, SegmentMember } from "../types/segment";

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

  // Filter state for All / Dynamic / Static / Archive
  const [segmentTypeFilter, setSegmentTypeFilter] = useState<
    "All" | "Dynamic" | "Static" | "Archive"
  >("All");

  // Edit and Delete dialog state
  const [editingSegment, setEditingSegment] = useState<SegmentListItem | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deletingSegment, setDeletingSegment] = useState<SegmentListItem | null>(null);

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

  const handleToggleArchive = useCallback(async (segment: SegmentListItem) => {
    const nextIsArchived = !segment.isArchived;
    setSegments((prev) =>
      prev.map((s) => (s.id === segment.id ? { ...s, isArchived: nextIsArchived } : s))
    );
    try {
      await segmentsApi.update(segment.id, { isArchived: nextIsArchived });
    } catch {
      // Keep optimistic local state
    }
  }, []);

  const handleDeleteConfirmed = useCallback(async (id: string) => {
    setDeletingSegment(null);
    setSegments((prev) => prev.filter((s) => s.id !== id));
    try {
      await segmentsApi.delete(id);
    } catch {
      // Keep optimistic local state
    }
  }, []);

  const filteredSegments = segments.filter((s) => {
    if (segmentTypeFilter === "Archive") {
      return s.isArchived === true;
    }
    if (s.isArchived) return false;

    if (segmentTypeFilter === "Dynamic") return s.type === "Dynamic";
    if (segmentTypeFilter === "Static") return s.type === "Static";
    return true;
  });

  const membersPagination = useClientPagination(members);
  const segmentsPagination = useClientPagination(filteredSegments);

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
      <div className="flex flex-col gap-md sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-sm">
          <h1 className="text-headline-md font-bold tracking-tight text-foreground">
            Lists &amp; Segments
          </h1>
          <p className="text-body-md text-muted-foreground">
            Customer segments and groupings for targeting.
          </p>
        </div>
        <NewSegmentSheet onCreated={() => void loadSegments()} />
      </div>

      <Card className="shadow-none border border-border/60">
        <CardHeader className="pb-md p-lg">
          <CardTitle className="text-title-lg font-bold">Segments</CardTitle>
        </CardHeader>
        <CardContent className="p-lg pt-0 space-y-md">
          <div className="w-full flex justify-start pb-xs">
            <Tabs
              value={segmentTypeFilter}
              onValueChange={(val) => {
                setSegmentTypeFilter(val as any);
                segmentsPagination.setPage(1);
              }}
            >
              <TabsList aria-label="Filter segments by type">
                <TabsTrigger value="All">All</TabsTrigger>
                <TabsTrigger value="Dynamic">Dynamic</TabsTrigger>
                <TabsTrigger value="Static">Static</TabsTrigger>
                <TabsTrigger value="Archive">Archive</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <TableSkeleton columns={4} />
          ) : error ? (
            <div className="p-xl text-destructive">{error}</div>
          ) : filteredSegments.length === 0 ? (
            <div className="p-xl text-muted-foreground">No segments found.</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md">
                {segmentsPagination.pageItems.map((segment) => (
                  <Card
                    key={segment.id}
                    className="shadow-none border border-border/60 hover:border-primary/50 transition-colors cursor-pointer flex flex-col justify-between"
                    onClick={() => void handleViewMembers(segment)}
                  >
                    <CardHeader className="p-lg pb-sm space-y-sm">
                      <div className="flex items-start justify-between gap-sm">
                        <div className="space-y-xs">
                          <CardTitle className="text-title-md font-bold flex items-center gap-2">
                            {segment.name}
                            {segment.isSystemDefined && (
                              <Badge variant="secondary">System</Badge>
                            )}
                            {segment.isArchived && (
                              <Badge variant="outline">Archived</Badge>
                            )}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge variant={segment.type === "Dynamic" ? "info" : "default"}>
                              {segment.type}
                            </Badge>
                            <span className="text-base text-muted-foreground flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{segment.memberCount}</span> members
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              void handleViewMembers(segment);
                            }}
                            title="View members"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Segment options"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[140px]">
                              <DropdownMenuItem
                                className="cursor-pointer text-base font-medium py-2 px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSegment(segment);
                                  setIsEditOpen(true);
                                }}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-base font-medium py-2 px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleToggleArchive(segment);
                                }}
                              >
                                {segment.isArchived ? "Unarchive" : "Archive"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="cursor-pointer text-base font-medium text-destructive focus:text-destructive py-2 px-3"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingSegment(segment);
                                }}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-lg pt-0 space-y-xs">
                      <p className="text-sm font-medium text-muted-foreground">Rules</p>
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
                          <span className="text-base text-muted-foreground">Manual membership</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <TablePagination pagination={segmentsPagination} itemLabel="segments" />
            </>
          )}
        </CardContent>
      </Card>

      <NewSegmentSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        segmentToEdit={editingSegment}
        onCreated={() => void loadSegments()}
      />

      <AlertDialog
        open={deletingSegment !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSegment(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Segment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingSegment?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deletingSegment) {
                  void handleDeleteConfirmed(deletingSegment.id);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
